# ACP (Agent Communication Protocol) Reference

ACP is an open protocol for communication between AI agents, applications, and humans. It addresses fragmentation in AI agent development by enabling agents built across different frameworks to work together.

**Note**: ACP repository was archived August 2025 and is now part of A2A under the Linux Foundation. For BrainFlow hackathon, we use the concept but implement via AG-UI directly.

## Core Concepts

### Agent Manifest
Describes capabilities for discovery without exposing implementation:
- Name, description, metadata
- Available tools and capabilities
- Communication preferences

### Messages & MessageParts
Core communication units:
- Ordered sequences of multimodal content
- Text, code, files, media supported

### Runs
Single agent executions:
- Specific inputs → processing → outputs
- Support sync, async, or streaming
- Intermediate and final outputs

### Sessions
Persistence across interactions:
- State and conversation history
- Multi-turn interactions

### Await
Agents can pause and request human input:
- Human-in-the-loop pattern
- Resume after user provides info

## Python SDK Example

```python
from acp_sdk.server import Server
from acp_sdk.models import Message

server = Server()

@server.agent()
async def brainstorm(input: list[Message], context: Context):
    """Brainstorming agent that generates ideas"""
    for message in input:
        # Process input and generate ideas
        yield Message(role="assistant", content="Generated idea: ...")

server.run()  # Runs on http://localhost:8000
```

## BrainFlow's ACP Strategy

For the hackathon, we simulate ACP's agent-switching concept:
- Different system prompts = different "agents"
- Same LLM, same tools, different personality
- Frontend doesn't need to know the difference

### Mode Switch Implementation (Simplified)

```python
AGENT_MODES = {
    "brainstorm": {
        "system_prompt": "You are creative, divergent...",
        "personality": "Generate many ideas, be surprising"
    },
    "architect": {
        "system_prompt": "You are technical, systematic...",
        "personality": "Think in systems, APIs, infrastructure"
    },
    "critic": {
        "system_prompt": "You are a devil's advocate...",
        "personality": "Find flaws, risks, counter-arguments"
    },
    "researcher": {
        "system_prompt": "You are evidence-based...",
        "personality": "Cite sources, provide data"
    }
}
```

### Production Vision
In production, each mode would be a real ACP agent:
- Different LLMs, different tools, different capabilities
- AG-UI protocol means the canvas doesn't change
- Any agent that can call `add_node`, `add_edge` tools works

## Resources
- Documentation: agentcommunicationprotocol.dev
- SDKs: Python and TypeScript
