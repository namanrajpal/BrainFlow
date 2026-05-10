# AG-UI Python SDK Reference

## Installation

```bash
pip install ag-ui-protocol
```

## Core Types

### RunAgentInput
Main input class for agent execution:
```python
class RunAgentInput:
    thread_id: str          # conversation thread identifier
    run_id: str             # current run identifier
    parent_run_id: Optional[str]  # spawning run ID
    state: Any              # agent state data
    messages: List[Message] # conversation history
    tools: List[Tool]       # available tools
    context: List[Context]  # contextual information
    forwarded_props: Any    # additional properties
```

### Tool
```python
class Tool:
    name: str           # tool identifier
    description: str    # functional purpose
    parameters: Any     # JSON Schema object
```

### Message Roles
`"developer" | "system" | "assistant" | "user" | "tool" | "activity" | "reasoning"`

### Message Types
- **DeveloperMessage**: role="developer", content string
- **SystemMessage**: role="system", content string
- **AssistantMessage**: role="assistant", optional content, optional tool_calls
- **UserMessage**: role="user", content as string or multimodal list
- **ToolMessage**: role="tool", content string, tool_call_id reference

---

## Event Classes

### Lifecycle Events
```python
from ag_ui.core import RunStartedEvent, RunFinishedEvent, RunErrorEvent

RunStartedEvent(type=EventType.RUN_STARTED, thread_id="...", run_id="...")
RunFinishedEvent(type=EventType.RUN_FINISHED, thread_id="...", run_id="...")
RunErrorEvent(type=EventType.RUN_ERROR, message="...")
```

### Text Message Events
```python
from ag_ui.core import (
    TextMessageStartEvent, TextMessageContentEvent,
    TextMessageEndEvent, TextMessageChunkEvent
)

TextMessageStartEvent(type=EventType.TEXT_MESSAGE_START, message_id="msg1", role="assistant")
TextMessageContentEvent(type=EventType.TEXT_MESSAGE_CONTENT, message_id="msg1", delta="Hello")
TextMessageEndEvent(type=EventType.TEXT_MESSAGE_END, message_id="msg1")

# Convenience (auto-expands to Start→Content→End):
TextMessageChunkEvent(type=EventType.TEXT_MESSAGE_CHUNK, message_id="msg1", delta="Hello")
```

### Tool Call Events
```python
from ag_ui.core import (
    ToolCallStartEvent, ToolCallArgsEvent,
    ToolCallEndEvent, ToolCallChunkEvent
)

ToolCallStartEvent(type=EventType.TOOL_CALL_START, tool_call_id="tc1", tool_call_name="add_node")
ToolCallArgsEvent(type=EventType.TOOL_CALL_ARGS, tool_call_id="tc1", delta='{"id":"n1",...}')
ToolCallEndEvent(type=EventType.TOOL_CALL_END, tool_call_id="tc1")

# Convenience:
ToolCallChunkEvent(
    type=EventType.TOOL_CALL_CHUNK,
    tool_call_id="tc1",
    tool_call_name="add_node",
    delta='{"id":"n1"}'
)
```

### State Events
```python
from ag_ui.core import StateSnapshotEvent, StateDeltaEvent

StateSnapshotEvent(type=EventType.STATE_SNAPSHOT, snapshot={"nodes": [], "edges": []})
StateDeltaEvent(type=EventType.STATE_DELTA, delta=[{"op": "add", "path": "/nodes/-", "value": {...}}])
```

---

## EventEncoder

```python
from ag_ui.encoder import EventEncoder
from ag_ui.core import TextMessageContentEvent, EventType

encoder = EventEncoder()

event = TextMessageContentEvent(
    type=EventType.TEXT_MESSAGE_CONTENT,
    message_id="msg_123",
    delta="Hello, world!"
)

encoded = encoder.encode(event)
# Output: data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"msg_123","delta":"Hello, world!"}\n\n
```

Constructor accepts optional `accept` parameter for content type negotiation:
```python
encoder = EventEncoder(accept=request.headers.get("accept"))
```

---

## Complete Server Example (FastAPI)

```python
import os
import uuid
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from ag_ui.core import (
    RunAgentInput, EventType, RunStartedEvent, RunFinishedEvent,
    RunErrorEvent, TextMessageChunkEvent, ToolCallChunkEvent,
)
from ag_ui.encoder import EventEncoder
from openai import OpenAI

app = FastAPI(title="AG-UI Server")
client = OpenAI()

@app.post("/")
async def agent_endpoint(input_data: RunAgentInput, request: Request):
    accept_header = request.headers.get("accept")
    encoder = EventEncoder(accept=accept_header)

    async def event_generator():
        try:
            # Emit run start
            yield encoder.encode(
                RunStartedEvent(
                    type=EventType.RUN_STARTED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id
                )
            )

            # Prepare tools for LLM
            tools = [
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.parameters,
                    }
                }
                for tool in input_data.tools
            ] if input_data.tools else None

            # Format messages
            messages = [
                {"role": msg.role, "content": msg.content or ""}
                for msg in input_data.messages
            ]

            # Stream from LLM
            stream = client.chat.completions.create(
                model="gpt-4o",
                stream=True,
                tools=tools,
                messages=messages,
            )

            message_id = str(uuid.uuid4())

            for chunk in stream:
                delta = chunk.choices[0].delta

                # Handle text content
                if delta.content:
                    yield encoder.encode(
                        TextMessageChunkEvent(
                            type=EventType.TEXT_MESSAGE_CHUNK,
                            message_id=message_id,
                            delta=delta.content,
                        )
                    )

                # Handle tool calls
                elif delta.tool_calls:
                    tool_call = delta.tool_calls[0]
                    yield encoder.encode(
                        ToolCallChunkEvent(
                            type=EventType.TOOL_CALL_CHUNK,
                            tool_call_id=tool_call.id,
                            tool_call_name=(tool_call.function.name
                                          if tool_call.function else None),
                            parent_message_id=message_id,
                            delta=(tool_call.function.arguments
                                  if tool_call.function else None),
                        )
                    )

            # Emit run completion
            yield encoder.encode(
                RunFinishedEvent(
                    type=EventType.RUN_FINISHED,
                    thread_id=input_data.thread_id,
                    run_id=input_data.run_id
                )
            )

        except Exception as error:
            yield encoder.encode(
                RunErrorEvent(
                    type=EventType.RUN_ERROR,
                    message=str(error)
                )
            )

    return StreamingResponse(
        event_generator(),
        media_type=encoder.get_content_type()
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```

---

## Testing with curl

```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "threadId": "thread_123",
    "runId": "run_456",
    "state": {},
    "messages": [{"id": "msg_1", "role": "user", "content": "Hello?"}],
    "tools": [],
    "context": [],
    "forwardedProps": {}
  }'
```
