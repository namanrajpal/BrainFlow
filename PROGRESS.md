# BrainFlow Canvas — Progress & Session Context

## What This Is

BrainFlow is an AI brainstorming partner for a **Generative UI Global Hackathon** (AI Tinkerers Seattle). It streams interactive mind map nodes onto an infinite canvas in real-time using the **AG-UI protocol**. The goal is to demonstrate how agents can directly manipulate frontend UI through standardized tool calls.

## Current State (Working)

The app is functional. You can:
1. Type a topic → agent asks clarifying questions → generates a mind map (Topic → Themes → Ideas)
2. Click nodes to see details + zoom in
3. Right-click nodes for: Expand, Elaborate, Challenge, Find Connections, Prioritize, Delete
4. Elaborate opens a rich side panel (40% width) with collapsible sections
5. "Elaborate Further" adds more sections progressively
6. Mode switching (Brainstorm/Architect/Critic/Researcher)
7. Screen glow effect when agent is working
8. ACP agent selector (Claude/Kiro/Gemini) in the elaboration panel

## Known Issues to Fix

1. **Elaborate sometimes doesn't generate sections** — The `elaborate_node` tool uses `sections_json` (string type) because CopilotKit couldn't serialize `object[]`. The agent sometimes doesn't call the tool correctly. The panel opens immediately but stays at "0 sections / Generating analysis..." if the agent fails to call `elaborate_node`.

2. **JSON truncation errors** — Long tool call arguments (especially `sections_json` with multiple paragraphs) can get truncated mid-stream, causing parse failures. Mitigated by keeping prompts concise but still happens occasionally.

3. **Ghost nodes not visible** — The `render` prop on `useCopilotAction` fires but CopilotKit v1.57 may not render it visibly (tool executes too fast).

4. **Context menu close doesn't stop agent** — Fixed (fire-and-forget pattern) but occasionally the agent response still gets interrupted.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite + TypeScript | React 19, Vite 8 |
| Canvas | React Flow (@xyflow/react) | ^12.10 |
| State | Zustand | ^5.0 |
| Styling | Tailwind CSS | v4.3 |
| Icons | Lucide React | latest |
| AG-UI Frontend | CopilotKit | v1.57.1 |
| Backend | Python FastAPI | ^0.111 |
| Agent | LangGraph StateGraph | ^0.3.25 |
| AG-UI Backend | ag-ui-langgraph | ^0.0.35 |
| LLM | GPT-5.4 (OpenAI) | via langchain-openai |
| Layout | Dagre | ^0.8.5 |

## Architecture

```
User types prompt
  → CopilotKit sends AG-UI request (POST /agent with method envelope)
  → FastAPI receives, extracts method (info/agent/connect/agent/run)
  → For agent/connect with no messages → empty RUN_STARTED/RUN_FINISHED stream
  → For agent/run → parse RunAgentInput, extract [Mode: xxx] prefix, route to correct agent
  → LangGraph agent calls GPT-5.4 with tools
  → GPT streams tool calls (add_node, add_edge, elaborate_node, etc.)
  → ag-ui-langgraph encodes as AG-UI events
  → CopilotKit receives events, dispatches to useCopilotAction handlers
  → Handlers update Zustand store → React Flow re-renders
  → Dagre auto-layouts → canvas zooms to fit
```

## CopilotKit Protocol Details (Important for Debugging)

CopilotKit v1.57 sends requests to a SINGLE endpoint (`/agent`) with a JSON envelope:

```json
{"method": "info"}                    → Return agent info
{"method": "agent/connect", "params": {"agentId": "default"}, "body": {RunAgentInput}}  → Connect/run
{"method": "agent/run", "params": {"agentId": "default"}, "body": {RunAgentInput}}      → Run with messages
```

The backend handles this by:
1. Checking `method` field
2. Extracting `body` for the actual RunAgentInput
3. Filling in missing required fields (threadId, runId, state, tools, context, forwardedProps)
4. For `agent/connect` with empty messages → return empty stream immediately
5. For actual runs → force unique thread_id per request (avoids LangGraph "Step already active" conflicts)
6. Extract `[Mode: xxx]` prefix from last user message to route to correct agent graph

## Backend Agents

Two agents registered:
- **default** (brainstorm/architect/critic/researcher) — 7 tools, temperature 1.0
- **elaboration** — 2 tools (elaborate_node, ask_user), temperature 0.8

The `agentId` from CopilotKit params determines routing. Currently everything goes through "default" since CopilotKit uses the provider's runtimeUrl.

## Frontend Tools Registered (useCopilotAction)

| Tool | Parameters | What it does |
|------|-----------|-------------|
| `add_node` | id, label, parent_id, node_type, description, color | Adds node to canvas + auto-layout |
| `add_edge` | source, target, label, style | Connects two nodes |
| `challenge_node` | target_id, challenge_text, severity | Creates red challenge node |
| `prioritize_nodes` | scores (object[]) | Batch-updates scores on all nodes |
| `ask_user` | question, options (string[]) | Shows interactive modal, waits for user click |
| `elaborate_node` | node_id, title, summary, sections_json (STRING!), agent_name | Appends sections to elaboration panel |
| `delete_node` | node_id | Removes node + edges from canvas |

**IMPORTANT**: `elaborate_node` uses `sections_json` as a STRING type (not object[]) because CopilotKit v1.57 fails to serialize `object[]` parameters into the tools list sent to the backend.

## Canvas Node Types & Colors

| Type | Color | Border | Use |
|------|-------|--------|-----|
| topic | Amber/Gold | #F59E0B | Root node (1 per canvas) |
| theme | Indigo | #6366F1 | Category branches (3-5) |
| idea | Soft Amber | #FBBF24 | Terminal leaf concepts |
| action | Emerald | #10B981 | Implementation steps (Architect mode) |
| challenge | Red | #EF4444 | Counter-arguments |
| question | Purple | #A855F7 | Open questions |
| detail | Slate | #64748B | Elaboration sections pinned to canvas |

Selected nodes get an amber ring (`ring-amber-400/70`) with amber shadow.

## File Structure

```
frontend/
├── public/
│   ├── logo.png              # BrainFlow logo (shown on empty canvas)
│   ├── claude.png            # ACP agent icons
│   ├── kiro.png
│   └── gemini.png
├── src/
│   ├── App.tsx               # CopilotKit provider, screen glow, layout
│   ├── components/
│   │   ├── BrainFlowCanvas.tsx    # React Flow + ALL useCopilotAction hooks + useCopilotReadable
│   │   ├── MindMapNode.tsx        # Custom node (Lucide icons, type colors, score badges)
│   │   ├── PromptInput.tsx        # Big initial → compact bar, logo on empty
│   │   ├── ModeSelector.tsx       # Mode dropdown with hints
│   │   ├── AgentStatus.tsx        # Thinking + reasoning + node/edge count
│   │   ├── DetailPanel.tsx        # Node detail + Elaborate/Expand/Challenge/Save buttons
│   │   ├── ElaborationPanel.tsx   # 40% width, collapsible sections, ACP selector, copy buttons
│   │   ├── NodeContextMenu.tsx    # Right-click (Expand/Elaborate/Challenge/Connect/Prioritize/Delete)
│   │   ├── ClarifyingQuestions.tsx # Interactive modal with keyword-matched Lucide icons
│   │   ├── GhostNode.tsx          # Generative UI placeholder
│   │   └── ErrorToast.tsx         # Error notifications
│   ├── store/
│   │   ├── canvasStore.ts         # nodes, edges, mode, threadId, selectedNodeId
│   │   ├── elaborationStore.ts    # activeElaboration (append mode), isGenerating
│   │   └── toastStore.ts          # error toasts
│   └── utils/
│       └── layout.ts             # Dagre (rankdir TB, nodesep 80, ranksep 100)
backend/
├── main.py                        # FastAPI + CopilotKit protocol + multi-agent routing
├── agent.py                       # LangGraph (brainstorm + elaboration graphs)
├── prompts.py                     # System prompts (brainstorm/architect/critic/researcher/elaboration)
├── requirements.txt               # fastapi, uvicorn, ag-ui-langgraph, langgraph, langchain-openai, python-dotenv
└── .env                           # OPENAI_API_KEY (user's actual key)
```

## Running

```bash
# Backend (auto-reloads on save)
cd backend && uvicorn main:app --reload --port 8000

# Frontend (Vite dev server)
cd frontend && npm run dev
```

## Key Design Decisions

1. **Unique thread_id per request** — Prevents LangGraph "Step already active" errors from concurrent CopilotKit requests
2. **Empty stream for agent/connect** — CopilotKit sends multiple connect requests on page load; we return RUN_STARTED → RUN_FINISHED immediately
3. **[Mode: xxx] prefix in messages** — Simple way to route to different agent graphs without changing CopilotKit's agentId
4. **sections_json as string** — CopilotKit can't serialize object[] parameters; we use JSON string instead
5. **Fire-and-forget for context menu actions** — Don't await appendMessage so closing the menu doesn't cancel the agent
6. **Elaboration panel opens immediately** — Set empty elaboration state before sending the message, so the panel appears while waiting for the agent
7. **No detail/question nodes on canvas** — Only Topic/Theme/Idea. All depth in the elaboration panel.
8. **fitView on node click** — Zooms to selected node for focus

## What to Work On Next

- Fix elaborate_node reliability (agent sometimes doesn't call it or generates truncated JSON)
- Make the elaboration panel show streaming text as it arrives (currently waits for full tool call)
- Add more AG-UI generative UI elements in the elaboration panel
- The "Add New Topic" button in bottom-right doesn't do anything yet
- The ACP agent buttons (Claude/Kiro/Gemini) in the elaboration panel are visual-only
- Consider adding `useCopilotReadable` for the elaboration state too

## Demo Script (2.5 min)

1. **Empty canvas** → Type "Hackathon ideas for AI Tinkerers using AG-UI" → Hit "Add Topic"
2. **Agent asks clarifying question** (modal with icons) → Click an option
3. **Watch nodes stream in** (Topic → Themes → Ideas) with screen glow
4. **Click a node** → Zooms in, detail panel shows on right
5. **Right-click → Elaborate** → Side panel opens, sections stream in
6. **Click "Elaborate Further"** → More sections added
7. **Right-click another node → Expand** (with custom direction)
8. **Right-click → Challenge** → Red nodes appear
9. **Switch to Architect mode** → Expand again → Green action nodes
10. **Show ACP selector** in elaboration panel → "Route to any coding agent"
11. **Copy as Prompt** → Paste into Claude/Kiro to start building

## Talking Points for Judges

- AG-UI protocol: agent calls tools that execute in the browser
- useCopilotAction: frontend tools the agent can invoke
- useCopilotReadable: automatic state sync (agent always knows canvas state)
- Generative UI: render prop shows previews during tool execution
- Human-in-the-loop: ask_user pauses agent, renders interactive UI, resumes with answer
- Multi-agent: different specialists (Strategist, Architect, Market Analyst, Risk Advisor)
- Progressive generation: elaborate_node called multiple times to build document
- ACP preview: agent routing UI for future multi-agent orchestration
- Zero custom SSE parsing: CopilotKit + ag-ui-langgraph handle protocol end-to-end
