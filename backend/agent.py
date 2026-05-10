"""LangGraph agent definition for BrainFlow brainstorming."""

from typing import Any, List

from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, MessagesState, END, START
from langgraph.checkpoint.memory import MemorySaver


# --- Tool Definitions ---
# These tools are declared here so LangGraph knows their schemas.
# Actual execution happens on the frontend via CopilotKit's useFrontendTool.


@tool
def add_node(
    id: str,
    label: str,
    parent_id: str,
    node_type: str,
    description: str = "",
    color: str = "",
) -> str:
    """Add a new idea node to the mind map canvas."""
    return f"Added node '{label}' ({node_type}) connected to {parent_id}"


@tool
def add_edge(
    source: str,
    target: str,
    label: str = "",
    style: str = "solid",
) -> str:
    """Connect two existing nodes with a labeled relationship."""
    return f"Connected {source} → {target}"


@tool
def challenge_node(
    target_id: str,
    challenge_text: str,
    severity: str = "medium",
) -> str:
    """Add a counter-argument or risk to an existing idea."""
    return f"Challenged node {target_id}: {challenge_text}"


@tool
def prioritize_nodes(scores: list[dict]) -> str:
    """Score and recolor nodes by feasibility and impact."""
    return f"Prioritized {len(scores)} nodes"


@tool
def ask_user(question: str, options: list[str]) -> str:
    """Ask the user a clarifying question with clickable options. Use this BEFORE brainstorming to understand what the user wants. The user will click an option and their answer will be returned."""
    return f"Asked: {question}"


@tool
def elaborate_node(node_id: str, title: str, summary: str, sections: list[dict], agent_name: str = "Strategist") -> str:
    """Generate a rich elaboration document for a node. Can be called MULTIPLE TIMES to progressively add sections. Each section has a 'heading' and 'content' field. agent_name identifies which specialist generated this batch."""
    return f"[{agent_name}] Elaborated node {node_id} with {len(sections)} sections"


@tool
def delete_node(node_id: str) -> str:
    """Remove a node and its edges from the canvas."""
    return f"Deleted node {node_id}"


# All tools available to the brainstorm agent
TOOLS = [add_node, add_edge, challenge_node, prioritize_nodes, ask_user, elaborate_node, delete_node]

# Elaboration-only tools (subset for the elaboration agent)
ELABORATION_TOOLS = [elaborate_node, ask_user]


class AgentState(MessagesState):
    """Agent state with tools from the frontend."""
    tools: List[Any] = []


def build_brainstorm_graph(system_prompt: str):
    """Build and compile a LangGraph StateGraph for brainstorming.

    Args:
        system_prompt: The system prompt that defines the agent's personality/mode.

    Returns:
        A compiled LangGraph graph ready for invocation.
    """
    llm = ChatOpenAI(model="gpt-5.4", streaming=True, temperature=1.0)
    llm_with_tools = llm.bind_tools(TOOLS, parallel_tool_calls=False)

    async def agent_node(state: AgentState):
        messages = [{"role": "system", "content": system_prompt}] + state["messages"]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_edge(START, "agent")
    graph.add_edge("agent", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory)


def build_elaboration_graph(system_prompt: str):
    """Build a dedicated elaboration agent that only generates rich documents.
    
    This is a SEPARATE agent from the brainstorm agent — it demonstrates
    multi-agent architecture via AG-UI. CopilotKit routes to this agent
    when the user requests elaboration.
    """
    llm = ChatOpenAI(model="gpt-5.4", streaming=True, temperature=0.8)
    llm_with_tools = llm.bind_tools(ELABORATION_TOOLS, parallel_tool_calls=False)

    async def elaboration_node(state: AgentState):
        messages = [{"role": "system", "content": system_prompt}] + state["messages"]
        response = await llm_with_tools.ainvoke(messages)
        return {"messages": [response]}

    graph = StateGraph(AgentState)
    graph.add_node("agent", elaboration_node)
    graph.add_edge(START, "agent")
    graph.add_edge("agent", END)

    memory = MemorySaver()
    return graph.compile(checkpointer=memory)
