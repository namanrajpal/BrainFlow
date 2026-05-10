# BrainFlow — Reference Documentation Index

This folder contains curated reference documentation for all technologies used in the BrainFlow project. Use this as a knowledge base when building or debugging.

## Project Context

BrainFlow is an AI brainstorming partner on an infinite canvas. It uses the AG-UI protocol to stream agent events (tool calls for adding nodes/edges) to a React Flow canvas in real-time. The backend is Python FastAPI, the frontend is React + Vite + Tailwind.

---

## Documentation Map

### AG-UI Protocol (Core Protocol)
The event-based protocol that connects our agent backend to the frontend canvas.

| File | Contents |
|------|----------|
| [ag-ui/overview.md](ag-ui/overview.md) | What AG-UI is, architecture, installation, integrations |
| [ag-ui/events.md](ag-ui/events.md) | All event types (RUN_STARTED, TOOL_CALL_*, TEXT_MESSAGE_*, STATE_*), fields, consumption patterns |
| [ag-ui/python-sdk.md](ag-ui/python-sdk.md) | Python SDK: RunAgentInput, event classes, EventEncoder, complete server example |
| [ag-ui/js-client.md](ag-ui/js-client.md) | JS/TS SDK: HttpAgent, event subscription, AbstractAgent, tool definitions |
| [ag-ui/tools.md](ag-ui/tools.md) | Tool definitions, tool call lifecycle, frontend registration, BrainFlow tool schemas |
| [ag-ui/state-management.md](ag-ui/state-management.md) | State sync: StateSnapshot, StateDelta, JSON Patch (RFC 6902) |

### React Flow (@xyflow/react) — Canvas Library
The node-graph library that renders our mind map canvas.

| File | Contents |
|------|----------|
| [react-flow/getting-started.md](react-flow/getting-started.md) | Installation, basic setup, node/edge data structures, key hooks & components |
| [react-flow/custom-nodes.md](react-flow/custom-nodes.md) | Creating custom node components, Handle, nodeTypes registration, dynamic updates |
| [react-flow/api-reference.md](react-flow/api-reference.md) | ReactFlow props, useReactFlow() methods (getNodes, setNodes, addNodes, fitView, etc.) |
| [react-flow/layouting-dagre.md](react-flow/layouting-dagre.md) | Dagre integration with React Flow, auto-layout on node addition, animated transitions |

### Dagre — Layout Engine
Computes tree/graph positions for our nodes.

| File | Contents |
|------|----------|
| [dagre/reference.md](dagre/reference.md) | Installation, graph creation, node/edge setup, layout config (rankdir, nodesep, ranksep), output format |

### Zustand — State Management
Lightweight React state management for canvas state.

| File | Contents |
|------|----------|
| [zustand/reference.md](zustand/reference.md) | Store creation, selectors, actions, async, immer middleware, TypeScript patterns |

### FastAPI + SSE — Backend
Python backend streaming AG-UI events to frontend.

| File | Contents |
|------|----------|
| [fastapi-sse/reference.md](fastapi-sse/reference.md) | StreamingResponse, sse-starlette, AG-UI compatible endpoint, frontend consumption (fetch streaming) |

### CopilotKit — Optional Frontend Framework
React framework with native AG-UI support (can use directly or just as reference).

| File | Contents |
|------|----------|
| [copilotkit/reference.md](copilotkit/reference.md) | useCopilotAction, useCoAgent, useCopilotReadable, generative UI rendering, direct AG-UI consumption |

### ACP — Agent Communication Protocol
Agent-switching concept (simplified for hackathon).

| File | Contents |
|------|----------|
| [acp/reference.md](acp/reference.md) | What ACP is, manifests, runs, sessions, BrainFlow mode-switch strategy |

### Tailwind CSS — Styling
Rapid UI styling for nodes, panels, and animations.

| File | Contents |
|------|----------|
| [tailwind/reference.md](tailwind/reference.md) | Installation, node card patterns, animations, layout patterns (input bar, action bar, status panel) |

---

## Quick Reference: Key Patterns for BrainFlow

### The Core Loop
```
User types prompt → Frontend sends to backend via POST
→ Backend calls LLM with streaming tool calls
→ Backend maps LLM tool calls to AG-UI events (TOOL_CALL_START/ARGS/END)
→ Backend streams AG-UI events as SSE
→ Frontend receives SSE, parses events
→ On TOOL_CALL_START: create ghost node on canvas
→ On TOOL_CALL_ARGS: fill in node content (parse JSON)
→ On TOOL_CALL_END: finalize node, run dagre layout, animate into position
```

### Key Files to Build
```
Frontend: useAgentStream.ts (SSE consumer → canvas state)
Frontend: canvasStore.ts (Zustand store for nodes/edges)
Frontend: MindMapNode.tsx (custom React Flow node)
Frontend: layout.ts (dagre helper)
Backend:  main.py (FastAPI + SSE endpoint)
Backend:  agent.py (LLM + tool handling → AG-UI events)
```

### Event Flow for "Add Node"
```
Backend emits:
  TOOL_CALL_START  { toolCallId: "tc1", toolCallName: "add_node" }
  TOOL_CALL_ARGS   { toolCallId: "tc1", delta: '{"id":"n1","label":"Smart Invoicing",...}' }
  TOOL_CALL_END    { toolCallId: "tc1" }

Frontend handles:
  TOOL_CALL_START  → addNode({ id: temp, type: 'ghost' }) to canvas
  TOOL_CALL_ARGS   → parse JSON, updateNodeData(temp, parsed)
  TOOL_CALL_END    → solidify node, run layout, animate
```

---

## How to Use This Reference

Feed this README to your AI agent with:
```
Read all files in the docs/ folder for reference on how to implement BrainFlow.
Start with docs/README.md for the index, then read specific files as needed.
```

Or for a specific task:
```
Read docs/ag-ui/python-sdk.md and docs/fastapi-sse/reference.md to implement the backend SSE endpoint.
Read docs/react-flow/custom-nodes.md and docs/react-flow/layouting-dagre.md to implement the canvas.
```
