# AG-UI Protocol Overview

AG-UI is an open, lightweight, event-based protocol that standardizes how AI agents connect to user-facing applications. It enables seamless integration between AI agents, real-time user context, and interfaces.

## Key Features
- Real-time agentic chat with streaming
- Bidirectional state synchronization
- Generative UI with structured messages
- Frontend tool integration
- Human-in-the-loop collaboration

## Architecture
- Any event transport (SSE, WebSockets, webhooks)
- Loose event format matching for broad interoperability
- Reference HTTP implementation with default connector

## How AG-UI Relates to Other Protocols
- **MCP** provides agent tools
- **A2A** enables agent-to-agent communication
- **AG-UI** brings agents into user-facing applications

## Installation

```bash
# JavaScript/TypeScript
npm install @ag-ui/client @ag-ui/core

# Python
pip install ag-ui-protocol
```

## Supported Integrations
LangGraph, CrewAI, Microsoft Agent Framework, Google ADK, AWS Strands, Mastra, Pydantic AI, Agno, LlamaIndex, AG2

## Resources
- Documentation: https://docs.ag-ui.com/
- AG-UI Dojo: https://dojo.ag-ui.com/ (interactive examples)
- Discord: https://discord.gg/Jd3FzfdJa8
- License: MIT
