"""FastAPI backend for BrainFlow Canvas."""

import re

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from ag_ui.core import RunAgentInput
from ag_ui.encoder import EventEncoder
from ag_ui_langgraph import LangGraphAgent

from agent import build_brainstorm_graph, build_elaboration_graph
from prompts import BRAINSTORM_PROMPT, ARCHITECT_PROMPT, CRITIC_PROMPT, RESEARCHER_PROMPT, ELABORATION_PROMPT

# Load environment variables (OPENAI_API_KEY, etc.)
load_dotenv()

app = FastAPI(title="BrainFlow Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Build compiled graphs for each mode
graphs = {
    "brainstorm": build_brainstorm_graph(BRAINSTORM_PROMPT),
    "architect": build_brainstorm_graph(ARCHITECT_PROMPT),
    "critic": build_brainstorm_graph(CRITIC_PROMPT),
    "researcher": build_brainstorm_graph(RESEARCHER_PROMPT),
}

# Create a LangGraphAgent instance per mode
agents = {
    mode: LangGraphAgent(
        name=mode,
        graph=graph,
        description=f"BrainFlow {mode} agent",
    )
    for mode, graph in graphs.items()
}

# Dedicated elaboration agent (separate from brainstorm agents)
elaboration_graph = build_elaboration_graph(ELABORATION_PROMPT)
elaboration_agent = LangGraphAgent(
    name="elaboration",
    graph=elaboration_graph,
    description="BrainFlow Elaboration Specialist — generates rich deep-dive documents",
)

# Regex to extract mode prefix from message content: [Mode: brainstorm]
MODE_PREFIX_PATTERN = re.compile(r"^\[Mode:\s*(\w+)\]\s*")


def extract_mode_from_messages(input_data: RunAgentInput) -> str:
    """Extract the mode from the last user message's [Mode: xxx] prefix.

    Returns the mode string (default: 'brainstorm') and strips the prefix
    from the message content in-place.
    """
    # Look at messages in reverse to find the last user message with a mode prefix
    for msg in reversed(input_data.messages):
        if msg.role == "user" and hasattr(msg, "content") and isinstance(msg.content, str):
            match = MODE_PREFIX_PATTERN.match(msg.content)
            if match:
                mode = match.group(1).lower()
                # Strip the mode prefix from the message content
                msg.content = MODE_PREFIX_PATTERN.sub("", msg.content)
                if mode in agents:
                    return mode
                break
    return "brainstorm"


@app.post("/agent")
async def agent_endpoint(request: Request):
    """Mode-aware AG-UI endpoint that handles CopilotKit's protocol.
    
    CopilotKit sends JSON-RPC style requests with a 'method' field:
    - {"method": "info"} → return runtime info
    - {"method": "agent/connect", "params": {...}, "body": {RunAgentInput}} → run agent
    - {"method": "agent/run", "params": {...}, "body": {RunAgentInput}} → run agent
    """
    import uuid
    import json
    import sys

    body = await request.json()
    method = body.get("method", "")

    # Debug: log the incoming request
    print(f"=== REQUEST method={method} ===", file=sys.stderr)
    print(json.dumps(body, indent=2, default=str)[:3000], file=sys.stderr)

    # Handle CopilotKit "info" method request
    if method == "info":
        return {
            "agents": {
                "default": {
                    "name": "brainstorm",
                    "description": "BrainFlow brainstorming agent — generates ideas on the canvas",
                },
                "elaboration": {
                    "name": "elaboration",
                    "description": "BrainFlow Elaboration Specialist — generates rich deep-dive documents",
                },
            },
            "extensions": {},
        }

    # Handle threads listing (CopilotKit v2 feature)
    if method == "threads/list" or method.startswith("threads"):
        return {"threads": []}

    # For agent execution methods (agent/connect, agent/run, etc.)
    # CopilotKit wraps RunAgentInput in envelope.body
    agent_input = body.get("body", body)
    
    # Remove non-RunAgentInput keys
    if isinstance(agent_input, dict):
        agent_input = {k: v for k, v in agent_input.items() if k != "method"}
    
    # Ensure required fields have defaults if CopilotKit doesn't send them
    if isinstance(agent_input, dict):
        if "threadId" not in agent_input and "thread_id" not in agent_input:
            agent_input["threadId"] = str(uuid.uuid4())
        if "runId" not in agent_input and "run_id" not in agent_input:
            agent_input["runId"] = str(uuid.uuid4())
        if "state" not in agent_input:
            agent_input["state"] = {}
        if "messages" not in agent_input:
            agent_input["messages"] = []
        if "tools" not in agent_input:
            agent_input["tools"] = []
        if "context" not in agent_input:
            agent_input["context"] = []
        if "forwardedProps" not in agent_input and "forwarded_props" not in agent_input:
            agent_input["forwardedProps"] = {}

    # For agent/connect with no messages, return an empty successful stream
    # (CopilotKit uses this to establish the connection)
    messages = agent_input.get("messages", [])
    if method == "agent/connect" and len(messages) == 0:
        from ag_ui.core import RunStartedEvent, RunFinishedEvent, EventType
        accept_header = request.headers.get("accept")
        encoder = EventEncoder(accept=accept_header)
        thread_id = agent_input.get("threadId", agent_input.get("thread_id", str(uuid.uuid4())))
        run_id = agent_input.get("runId", agent_input.get("run_id", str(uuid.uuid4())))

        async def empty_stream():
            yield encoder.encode(RunStartedEvent(type=EventType.RUN_STARTED, thread_id=thread_id, run_id=run_id))
            yield encoder.encode(RunFinishedEvent(type=EventType.RUN_FINISHED, thread_id=thread_id, run_id=run_id))

        return StreamingResponse(empty_stream(), media_type=encoder.get_content_type())

    # Parse into RunAgentInput
    input_data = RunAgentInput.model_validate(agent_input)

    # Force a unique thread_id per request to avoid "Step already active" conflicts
    # when CopilotKit sends multiple concurrent requests with the same threadId
    input_data = input_data.copy(update={"thread_id": str(uuid.uuid4())})

    # Extract mode from the user message and strip the prefix
    mode = extract_mode_from_messages(input_data)

    # Check if this request is for the elaboration agent (via agentId in params)
    params = body.get("params", {})
    agent_id = params.get("agentId", "default")

    if agent_id == "elaboration":
        agent = elaboration_agent
    else:
        # Select the brainstorm agent for this mode
        agent = agents[mode]

    # Get the accept header from the request
    accept_header = request.headers.get("accept")
    encoder = EventEncoder(accept=accept_header)

    async def event_generator():
        async for event in agent.run(input_data):
            yield encoder.encode(event)

    return StreamingResponse(
        event_generator(),
        media_type=encoder.get_content_type(),
    )


@app.get("/agent/threads")
async def agent_threads():
    """CopilotKit threads endpoint."""
    return {"threads": []}


@app.get("/agent/info")
async def agent_info():
    """CopilotKit runtime info endpoint."""
    return {
        "agents": [
            {
                "name": "brainstorm",
                "description": "BrainFlow brainstorming agent",
            }
        ]
    }


@app.get("/agent/health")
async def agent_health():
    return {"status": "ok", "modes": list(agents.keys())}


@app.get("/health")
async def health():
    return {"status": "ok"}
