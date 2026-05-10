
<p align="center">
  <img src="frontend/public/logo.png" width="120" alt="BrainFlow Logo" />
</p>

<h1 align="center">BrainFlow</h1>

<p align="center">
  <strong>An AI brainstorming partner that thinks WITH you — on an infinite canvas.</strong>
</p>

<p align="center">
  <a href="#demo">Demo</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#ag-ui-in-action">AG-UI in Action</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AG--UI-Protocol-blue?style=for-the-badge" alt="AG-UI Protocol" />
  <img src="https://img.shields.io/badge/CopilotKit-Powered-green?style=for-the-badge" alt="CopilotKit" />
  <img src="https://img.shields.io/badge/LangGraph-Agent-orange?style=for-the-badge" alt="LangGraph" />
  <img src="https://img.shields.io/badge/React_Flow-Canvas-purple?style=for-the-badge" alt="React Flow" />
</p>

---

## The Problem

Every brainstorm starts the same way:

```
You: *opens blank document*
You: *stares*
You: *types something*
You: *deletes it*
You: *opens ChatGPT instead*
ChatGPT: "Here are 10 bullet points..."
You: *stares at wall of text*
```

**Chat interfaces kill spatial thinking.** Ideas aren't linear — they're graphs. They branch, connect, conflict, and cluster. But every AI tool today forces your thoughts through a single-column text tube.

## The Solution

BrainFlow gives your AI a **canvas instead of a chat box**. The agent doesn't reply with text — it generates **interactive mind map nodes** that stream onto a visual graph in real-time.

```
                        ┌─────────────────┐
                        │  🎯 AI Tools    │
                        │  for Freelancers│
                        └────────┬────────┘
                 ┌───────────────┼───────────────┐
                 │               │               │
        ┌────────▼──────┐ ┌─────▼──────┐ ┌──────▼───────┐
        │ 💡 Smart      │ │ 💡 Client  │ │ 💡 Time      │
        │ Invoicing     │ │ Comms Hub  │ │ Tracking     │
        └───┬───────┬───┘ └────────────┘ └──────────────┘
            │       │
    ┌───────▼──┐ ┌──▼──────────┐
    │ ⚡ Stripe │ │ 📋 Auto-    │
    │ dominates│ │ categorize  │
    │ (risk)   │ │ expenses    │
    └──────────┘ └─────────────┘
```

Every node streams in one-by-one. Every run generates a different structure. The UI **is** the output.

---

## Demo

<!-- SCREENSHOT PLACEHOLDER: Full canvas with nodes blooming -->
> 📸 **TODO: Add screenshot of full BrainFlow canvas with generated nodes**

### The Six Magic Moments

| # | Moment | What Happens |
|---|--------|-------------|
| 1 | **The Bloom** | Type a topic → nodes stream onto canvas one by one, edges animate in |
| 2 | **The Deep Dive** | Click any node → hit Expand → child ideas stream in underneath |
| 3 | **The Challenge** | Hit Challenge → red counter-argument nodes appear with risks |
| 4 | **The Connection** | Agent discovers non-obvious links between distant nodes |
| 5 | **The Mode Switch** | Switch from Brainstorm → Architect → same canvas, different thinker |
| 6 | **The Prioritize** | All nodes recolor green/yellow/red with feasibility scores |

<!-- SCREENSHOT PLACEHOLDER: Before and after prioritize -->
> 📸 **TODO: Add screenshot showing nodes before/after prioritization (color change)**

---

## How It Works

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   You type: "AI tools for freelancers who hate admin work"               │
│                                                                          │
│   ┌──────────┐      ┌──────────────┐      ┌───────────────────────┐     │
│   │          │ SSE  │              │ Tool  │                       │     │
│   │  React   │◄─────│   FastAPI    │◄──────│   LLM (Claude/GPT)   │     │
│   │  Flow    │events│   + AG-UI    │ calls │   via LangGraph       │     │
│   │  Canvas  │      │   Encoder    │       │                       │     │
│   │          │      │              │       │   "I'll explore       │     │
│   └──────────┘      └──────────────┘       │    5 angles..."       │     │
│        │                                    │                       │     │
│        ▼                                    │   add_node(           │     │
│   Nodes appear                              │     "Smart Invoicing" │     │
│   one by one ✨                             │   )                   │     │
│                                             └───────────────────────┘     │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

The agent doesn't return text. It calls **tools** — and each tool call renders as a new visual element on the canvas:

| Agent Tool Call | What You See |
|----------------|-------------|
| `add_node(label="Smart Invoicing", type="idea")` | 💡 Blue node blooms onto canvas |
| `challenge_node(target="Smart Invoicing", text="Stripe dominates")` | ⚡ Red node appears connected |
| `add_edge(source="Comms", target="Expenses", label="combine these")` | Dotted line draws between distant nodes |
| `prioritize_nodes(scores=[...])` | All nodes recolor with scores |

---

## AG-UI in Action

BrainFlow is built on the **AG-UI (Agent-User Interaction) protocol** — the open standard for streaming agent events to frontends.

### Why AG-UI Matters Here

Traditional AI apps: `User → API → JSON → Render`

BrainFlow with AG-UI:
```
User → Agent streams events → Each event IS a UI update

  TOOL_CALL_START  →  Ghost node appears (pulsing placeholder)
  TOOL_CALL_ARGS   →  "Adding: Smart Invoicing..." indicator
  TOOL_CALL_END    →  Node solidifies on canvas with animation
  RUN_FINISHED     →  Canvas settles, thinking indicator off
```

The protocol makes the agent's thinking process **visible and spatial**. You don't wait for a response — you watch the mind map grow.

### CopilotKit Integration

Frontend tools are registered via `useCopilotAction` with **generative UI render callbacks**:

```tsx
useCopilotAction({
  name: "add_node",
  handler: async ({ id, label, parent_id, node_type }) => {
    store.addNode({ id, label, parentId: parent_id, nodeType: node_type })
    store.runLayout()
    return `Added node: ${label}`
  },
  // 👇 Generative UI — shows preview while tool executes
  render: ({ status, args }) => {
    if (status === "executing") {
      return <GhostNode label={args?.label} nodeType={args?.node_type} />
    }
    return <></>
  },
})
```

<!-- SCREENSHOT PLACEHOLDER: Ghost node indicator during generation -->
> 📸 **TODO: Add screenshot showing the ghost node "Adding: ..." indicator**

---

## Agent Modes

The same canvas, four different thinkers. Switch mid-session — the graph persists, the personality changes.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  🔵 Brainstorm    Creative, divergent, surprising ideas         │
│  🟢 Architect     Technical breakdown, APIs, systems            │
│  🔴 Critic        Devil's advocate, risks, counter-arguments    │
│  🟣 Researcher    Evidence-based, real examples, data           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Under the hood, mode switching = new AG-UI session (new `threadId`) with a different system prompt. The canvas state carries over. In production, each mode could be a **completely separate ACP agent** — a Perplexity-style researcher, a coding architect, a red-team critic. The AG-UI protocol means the canvas doesn't care who's driving it.

<!-- SCREENSHOT PLACEHOLDER: Mode selector dropdown -->
> 📸 **TODO: Add screenshot of mode selector with different mode active**

---

## Interactions

| Action | Trigger | What the Agent Does |
|--------|---------|-------------------|
| **Brainstorm** | Type any topic | Generates 4-6 idea nodes with connections |
| **Expand** | Click node → Expand | Adds 3-5 child nodes under selected node |
| **Challenge** | Click node → Challenge | Adds red counter-argument nodes |
| **Find Connections** | Click "Find Connections" | Draws edges between non-obvious related nodes |
| **Prioritize** | Click "Prioritize" | Scores all nodes 1-10, recolors green/yellow/red |
| **Custom Expand** | Right-click → type direction | Expands in a specific direction you choose |

<!-- SCREENSHOT PLACEHOLDER: Right-click context menu on a node -->
> 📸 **TODO: Add screenshot of right-click context menu**

---

## Architecture

```
frontend/                          backend/
├── React + Vite + TypeScript      ├── Python FastAPI
├── @xyflow/react (React Flow)     ├── LangGraph StateGraph
├── @copilotkit/react-core         ├── ag-ui-langgraph bridge
├── Zustand (state)                ├── langchain-openai (LLM)
├── dagre (auto-layout)            └── AG-UI EventEncoder
└── Tailwind CSS
         │                                    │
         │◄──── AG-UI Protocol (SSE) ────────│
         │      TOOL_CALL_START              │
         │      TOOL_CALL_ARGS               │
         │      TOOL_CALL_END                │
         │      TEXT_MESSAGE_CONTENT         │
         │      RUN_STARTED / RUN_FINISHED   │
```

### Key Design Decisions

1. **CopilotKit as AG-UI bridge** — handles protocol compliance, message routing, tool serialization
2. **Frontend-executed tools** — agent declares intent via tool calls, frontend renders the result (true generative UI)
3. **Sequential tool calls** (`parallel_tool_calls=False`) — forces one-by-one node generation for the streaming visual effect
4. **Graph context in every message** — full canvas snapshot sent with each request so agent always knows what's on screen
5. **Mode = session boundary** — switching modes generates a new `threadId`, isolating conversation context while preserving visual state

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.10+
- OpenAI API key (or compatible provider)

### Setup

```bash
# Clone
git clone <your-repo-url>
cd AiTinkererHackathon

# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Frontend (new terminal)
cd frontend
npm install
```

### Run

```bash
# Terminal 1 — Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open `http://localhost:5173` — you'll see the BrainFlow canvas with the prompt "What do you want to brainstorm?"

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Canvas | `@xyflow/react` v12 | Infinite node graph with custom nodes |
| AI Bridge | `@copilotkit/react-core` v1.57 | AG-UI protocol client + frontend tools |
| State | Zustand | Reactive store for nodes, edges, mode |
| Layout | dagre | Automatic tree positioning |
| Styling | Tailwind CSS v4 | Dark theme, animations |
| Backend | FastAPI | AG-UI SSE endpoint |
| Agent | LangGraph + langchain-openai | Stateful agent with tool calling |
| Protocol | `ag-ui-langgraph` | LangGraph → AG-UI event bridge |

---

## What Makes This "Generative UI"

| Traditional AI App | BrainFlow |
|-------------------|-----------|
| Agent returns text → app renders it | Agent calls tools → **each tool IS a UI component** |
| Static layout with dynamic content | **Layout itself is generated** (dagre recomputes per node) |
| Same interface every time | **Every brainstorm produces a unique visual structure** |
| User reads, then acts | User **watches the interface being built**, then steers |
| One response format | Different node types, colors, edges, scores — all generated |

The interface is not a container for AI output. **The interface IS the AI output.**

---

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI + CopilotKit JSON-RPC handler
│   ├── agent.py          # LangGraph graph with tool definitions
│   ├── prompts.py        # System prompts per agent mode
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx                    # CopilotKit provider + layout
│   │   ├── components/
│   │   │   ├── BrainFlowCanvas.tsx    # React Flow + useCopilotAction tools
│   │   │   ├── MindMapNode.tsx        # Custom node (colored, typed, scored)
│   │   │   ├── GhostNode.tsx          # Generative UI placeholder
│   │   │   ├── PromptInput.tsx        # Input bar (hero + compact modes)
│   │   │   ├── ActionBar.tsx          # Expand/Challenge/Connect/Prioritize
│   │   │   ├── ModeSelector.tsx       # Agent mode dropdown
│   │   │   ├── NodeContextMenu.tsx    # Right-click actions
│   │   │   ├── DetailPanel.tsx        # Selected node info panel
│   │   │   └── AgentStatus.tsx        # Thinking indicator
│   │   ├── store/
│   │   │   └── canvasStore.ts         # Zustand: nodes, edges, mode, layout
│   │   └── utils/
│   │       └── layout.ts             # dagre layout engine
│   └── package.json
├── docs/                              # Reference documentation
└── plan/                              # Design docs & implementation plan
```

---

## Built For

<p align="center">
  <strong>🏆 Generative UI Global Hackathon: Agentic Interfaces</strong><br/>
  AI Tinkerers Seattle • May 9, 2026
</p>

<p align="center">
  Sponsored by Google DeepMind • CopilotKit
</p>

---

<p align="center">
  <sub>Built with ❤️ and too much coffee in 4 hours</sub>
</p>
