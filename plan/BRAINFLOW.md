# BrainFlow — AI Brainstorming Partner on an Infinite Canvas

## Elevator Pitch

BrainFlow is an AI brainstorming partner that thinks WITH you on an infinite canvas. Instead of dumping text in a chat box, the agent generates ideas as interactive nodes that stream onto a visual map in real-time. You click, drag, challenge, and steer — the agent responds spatially. Built on AG-UI over ACP, any agent backend can plug in and speak the same visual language.

---

## Hackathon Context

- **Event:** Generative UI Global Hackathon: Agentic Interfaces (AI Tinkerers, May 9, 2026)
- **Theme:** AI agents that generate interactive UI at runtime — not chatbots spitting text
- **Approved Stack:** A2UI (Google DeepMind), CopilotKit + AG-UI, MCP Apps, any model provider
- **Sponsors:** Google DeepMind, CopilotKit
- **Time:** ~4 hours to build
- **Demo:** 2-3 minutes, working code only

---

## Why This Wins

1. **Visual & demo-friendly** — mind maps growing in real-time on a canvas is inherently more impressive than text streaming in a chat box
2. **Showcases AG-UI perfectly** — streaming events map directly to nodes appearing, expanding, connecting on the canvas
3. **The "generative UI" IS the mind map** — every brainstorm generates a different visual structure
4. **Solves a real problem** — "Most people open a blank mind map and stall because they're trying to think and organize at the same time"
5. **Pluggable agents via ACP** — differentiator vs. existing tools. Switch thinking styles mid-session
6. **Google sponsor alignment** — Google just built "Product Canvas" (same concept). They'll recognize and appreciate this

---

## What Makes This NOT "Just Another MindMap AI"

| MindMap AI (existing tools) | BrainFlow |
|-----------|-----------|
| One-shot generation (dump entire map) | **Streaming** — nodes appear one by one as agent thinks |
| Static after generation | **Interactive** — click, challenge, redirect mid-generation |
| Single AI personality | **Pluggable agents** via ACP — switch thinking styles |
| No approval flow | **Human-in-the-loop** — agent asks before restructuring |
| No visibility into reasoning | **AG-UI streaming** — see the agent's thought process live |
| Closed system | **Open protocol** — any AG-UI compatible agent works |

---

## Wow Moments (Demo Beats)

| # | Moment | What Judges See | AG-UI Mechanism |
|---|--------|----------------|-----------------|
| 1 | **The Bloom** | User types a topic → nodes stream onto canvas one by one, edges animate in | `TOOL_CALL_START` → `TOOL_CALL_ARGS` (streaming) → `TOOL_CALL_END` per node |
| 2 | **The Deep Dive** | User clicks a node → agent expands with child nodes streaming in | New `RUN` triggered → multiple `TOOL_CALL` events |
| 3 | **The Challenge** | User hits "Challenge" → red counter-nodes appear with opposing arguments | `TOOL_CALL` with node_type="challenge", red styling |
| 4 | **The Connection** | Agent discovers non-obvious link between distant nodes → edge animates across canvas | `TOOL_CALL` for `add_edge` between existing nodes |
| 5 | **The Mode Switch** | User switches agent backend (brainstorm → architect) → same canvas, different thinking style | ACP session/prompt swap, same AG-UI frontend |
| 6 | **The Prioritize** | Nodes recolor green/yellow/red with scores appearing | `TOOL_CALL` for `prioritize_nodes` → batch state update |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              React Flow Canvas (@xyflow/react)                │ │
│  │  - Custom MindMapNode component (title, description, type)   │ │
│  │  - Custom animated edges                                     │ │
│  │  - dagre auto-layout (positions new nodes automatically)     │ │
│  │  - Minimap + Controls + zoom/pan                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Prompt Input │  │ Action Bar   │  │ Agent Status Panel    │  │
│  │ (text box)   │  │ [Expand]     │  │ "Thinking..."         │  │
│  │              │  │ [Challenge]  │  │ "Adding 3 nodes..."   │  │
│  │              │  │ [Connect]    │  │ streaming indicator   │  │
│  │              │  │ [Prioritize] │  │                       │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              AG-UI Event Consumer (SSE client)                │ │
│  │  - Connects to backend SSE endpoint                          │ │
│  │  - TOOL_CALL_START → create node placeholder (faded)         │ │
│  │  - TOOL_CALL_ARGS → stream node content, parse JSON args     │ │
│  │  - TOOL_CALL_END → finalize node, trigger layout animation   │ │
│  │  - STATE_UPDATE → update edges, colors, groups               │ │
│  │  - TEXT_MESSAGE_CONTENT → agent reasoning in status panel    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────┘
                                    │ SSE + REST
                                    │
┌───────────────────────────────────▼─────────────────────────────┐
│              BACKEND (Python FastAPI)                             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  AG-UI SSE Endpoint: /api/stream                             │ │
│  │  - Accepts prompt + current graph state                      │ │
│  │  - Calls LLM with system prompt + tools                     │ │
│  │  - Streams AG-UI events as LLM produces tool calls           │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  LLM Integration (Claude / GPT / Gemini)                     │ │
│  │  - System prompt: "You are a brainstorming partner..."       │ │
│  │  - Tools: add_node, add_edge, expand_node, challenge_node,  │ │
│  │    prioritize_nodes                                          │ │
│  │  - Streaming tool calls → mapped to AG-UI events             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  ACP Bridge (from reference project — optional for demo)     │ │
│  │  - Enables plugging in different agent backends              │ │
│  │  - Session management, tool policy, approval flow            │ │
│  │  - Can be simplified/faked for hackathon                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## Simplification Strategy (What to Fake)

To maximize wow in 4 hours, we simplify aggressively:

| Full Version | Hackathon Version |
|-------------|-------------------|
| Full ACP subprocess management | Direct LLM API call with streaming |
| Multiple agent backends via ACP | Mode switch = different system prompt (same LLM) |
| Persistent sessions in SQLite | In-memory state only |
| Tool approval via ACP request_permission | Simple confirm dialog on frontend |
| Complex layout algorithms | dagre with fixed spacing |
| Real MCP tool integrations | Agent pretends to search/research (prompt-based) |

**Key principle:** The AG-UI event protocol between frontend and backend is REAL. The backend can be simplified. Judges see the frontend experience, not the backend complexity.

---

## AG-UI Event Mapping

### How LLM Tool Calls Become Canvas Actions

```
LLM streams: tool_call(name="add_node", args={id:"n1", label:"Invoice Automation", ...})
                    ↓
Backend emits AG-UI events:
  → TOOL_CALL_START {toolCallId: "tc1", toolName: "add_node"}
  → TOOL_CALL_ARGS  {toolCallId: "tc1", delta: '{"id":"n1","label":"Invoice...'}
  → TOOL_CALL_END   {toolCallId: "tc1"}
                    ↓
Frontend receives SSE:
  → On TOOL_CALL_START: create placeholder node (pulsing/faded)
  → On TOOL_CALL_ARGS: parse JSON, update node label/description
  → On TOOL_CALL_END: finalize node, run dagre layout, animate into position
```

### Event Types Used

| AG-UI Event | Canvas Action |
|-------------|--------------|
| `RUN_STARTED` | Show "Agent is thinking..." indicator, pulse canvas border |
| `TEXT_MESSAGE_START` | Open reasoning panel |
| `TEXT_MESSAGE_CONTENT` | Stream agent's reasoning text (why it's adding these nodes) |
| `TEXT_MESSAGE_END` | Close reasoning panel |
| `TOOL_CALL_START` | Create ghost/placeholder node on canvas |
| `TOOL_CALL_ARGS` | Fill in node content progressively |
| `TOOL_CALL_END` | Solidify node, animate edges, re-layout |
| `STATE_UPDATE` | Batch updates (recolor, reposition, group) |
| `RUN_FINISHED` | Remove thinking indicator, settle canvas |

---

## Tool Definitions

```json
[
  {
    "name": "add_node",
    "description": "Add a new idea node to the mind map",
    "inputSchema": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "label": {"type": "string", "description": "Short title (3-6 words)"},
        "description": {"type": "string", "description": "One sentence elaboration"},
        "parent_id": {"type": "string", "description": "ID of parent node to connect from. Use 'root' for top-level."},
        "node_type": {"type": "string", "enum": ["idea", "detail", "question", "challenge", "action"]},
        "color": {"type": "string", "description": "Optional hex color or semantic: green/yellow/red/blue"}
      },
      "required": ["id", "label", "parent_id", "node_type"]
    }
  },
  {
    "name": "add_edge",
    "description": "Connect two existing nodes with a labeled relationship",
    "inputSchema": {
      "type": "object",
      "properties": {
        "source": {"type": "string", "description": "Source node ID"},
        "target": {"type": "string", "description": "Target node ID"},
        "label": {"type": "string", "description": "Relationship description"},
        "style": {"type": "string", "enum": ["solid", "dashed", "dotted"]}
      },
      "required": ["source", "target"]
    }
  },
  {
    "name": "expand_node",
    "description": "Generate multiple child nodes for an existing node (batch operation)",
    "inputSchema": {
      "type": "object",
      "properties": {
        "parent_id": {"type": "string"},
        "children": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "label": {"type": "string"},
              "description": {"type": "string"},
              "node_type": {"type": "string", "enum": ["idea", "detail", "question", "challenge", "action"]}
            },
            "required": ["id", "label", "node_type"]
          }
        }
      },
      "required": ["parent_id", "children"]
    }
  },
  {
    "name": "challenge_node",
    "description": "Add a counter-argument, risk, or question to an existing idea",
    "inputSchema": {
      "type": "object",
      "properties": {
        "target_id": {"type": "string", "description": "Node being challenged"},
        "challenge_text": {"type": "string", "description": "The counter-argument or risk"},
        "severity": {"type": "string", "enum": ["low", "medium", "high"]}
      },
      "required": ["target_id", "challenge_text", "severity"]
    }
  },
  {
    "name": "prioritize_nodes",
    "description": "Score and recolor nodes by feasibility and impact",
    "inputSchema": {
      "type": "object",
      "properties": {
        "scores": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "node_id": {"type": "string"},
              "score": {"type": "number", "minimum": 1, "maximum": 10},
              "color": {"type": "string", "enum": ["green", "yellow", "red"]},
              "reason": {"type": "string"}
            },
            "required": ["node_id", "score", "color"]
          }
        }
      },
      "required": ["scores"]
    }
  }
]
```

---

## The "Plug-in Any Agent" Story (ACP Differentiator)

The frontend doesn't care what agent is behind the backend — it just consumes AG-UI events. Mode switching:

| Mode | System Prompt Personality | Node Types Generated |
|------|--------------------------|---------------------|
| **Brainstorm** | Creative, divergent, lots of ideas | idea, question, detail |
| **Architect** | Technical, systematic, structured | action, detail (with technical labels) |
| **Critic** | Devil's advocate, finds flaws | challenge, question |
| **Researcher** | Evidence-based, cites sources | detail (with source links) |

**Implementation:** Mode switch = swap system prompt in the backend. Same LLM, same tools, different personality. For the demo, this is instant and dramatic.

**Pitch to judges:** "In production, each mode would be a different ACP agent — a coding agent, a research agent with MCP web search, a domain expert. The AG-UI protocol means the canvas doesn't need to change. Any agent that can call these tools works."

---

## Demo Script (2.5 minutes)

### Setup
- Browser open to BrainFlow — empty canvas with a prompt input at bottom
- Mode selector showing "Brainstorm" 

### Script

**[0:00-0:15] — The Hook**
> "This is BrainFlow. An AI brainstorming partner that thinks with you visually. No chat boxes. Let's brainstorm a startup idea."

**[0:15-0:40] — Wow Moment 1: The Bloom**
> Type: "AI tools for freelancers who hate admin work"
> 
> → Watch 5-6 nodes bloom onto canvas one by one. Each appears as a ghost, fills in, then solidifies. Edges animate between them. Agent reasoning streams in a small panel: "Freelancers spend 30% of time on admin. Key pain points: invoicing, scheduling, client communication..."

**[0:40-1:00] — Wow Moment 2: The Deep Dive**
> Click on "Smart Invoicing" node → hit [Expand]
> 
> → 3 child nodes stream in: "Auto-detect billable hours", "Client payment reminders", "Tax categorization"

**[1:00-1:20] — Wow Moment 3: The Challenge**
> Select "Smart Invoicing" → hit [Challenge]
> 
> → Red nodes appear: "Stripe/FreshBooks already dominate", "Low switching cost for users", "Margin pressure from AI commoditization"

**[1:20-1:40] — Wow Moment 4: The Connection**
> Hit [Find Connections]
> 
> → Agent draws a dotted edge between "Client Communication" and "Tax Categorization" — reasoning panel says: "These combine: an agent that reads client emails to auto-categorize expenses. Novel angle."

**[1:40-2:00] — Wow Moment 5: The Mode Switch**
> Switch dropdown from "Brainstorm" to "Architect"
> 
> → Agent adds technical nodes to the existing map: "Event-driven pipeline", "Email parser microservice", "QuickBooks API integration". Same canvas, different thinking style.

**[2:00-2:15] — Wow Moment 6: The Prioritize**
> Hit [Prioritize]
> 
> → Nodes recolor: green (high feasibility), yellow (medium), red (risky). Scores appear on each node.

**[2:15-2:30] — The Close**
> "Under the hood: AG-UI protocol streaming events to the canvas. ACP managing the agent session. Any AG-UI compatible agent can plug in — coding agents, research agents, domain experts. The canvas is the universal interface for thinking. Thank you."

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend framework | React + Vite | Fast, familiar, hot reload |
| Canvas library | @xyflow/react (React Flow) | Purpose-built for node graphs, has mind map tutorial |
| Layout engine | dagre | Auto-positions nodes in tree/graph layout |
| Styling | Tailwind CSS | Fast to style, looks good by default |
| SSE client | Native EventSource or fetch streaming | Consumes AG-UI events |
| Backend | Python FastAPI | Matches reference project, fast to build |
| LLM | Claude API (or OpenAI) | Streaming tool calls |
| AG-UI encoding | Custom SSE encoder (from reference project) | Emit typed events |
| State | In-memory (frontend Zustand store) | No persistence needed for demo |

---

## Build Order (4 Hours)

### Hour 1: Foundation
- [ ] Scaffold Vite + React + Tailwind project
- [ ] Install @xyflow/react, dagre
- [ ] Create basic canvas with hardcoded nodes (prove React Flow works)
- [ ] Create custom MindMapNode component (styled card with title, description, type badge)
- [ ] Set up FastAPI backend with single SSE endpoint
- [ ] Test: hardcoded AG-UI events → nodes appear on canvas

### Hour 2: Agent Integration
- [ ] Wire up LLM API (Claude/OpenAI) with streaming tool calls
- [ ] System prompt for brainstorming agent
- [ ] Tool definitions (add_node, add_edge, expand_node)
- [ ] Map streaming tool calls → AG-UI SSE events
- [ ] Frontend: prompt input → sends to backend → receives SSE → renders nodes
- [ ] Test: type a topic → nodes stream onto canvas

### Hour 3: Interactions & Polish
- [ ] Click node → "Expand" button → triggers new prompt with context
- [ ] "Challenge" button → triggers challenge prompt
- [ ] "Find Connections" → triggers connection-finding prompt
- [ ] "Prioritize" → triggers scoring prompt → recolors nodes
- [ ] Mode switcher (dropdown) → swaps system prompt
- [ ] dagre auto-layout on new nodes (animated transitions)
- [ ] Agent status panel (thinking indicator, reasoning text)

### Hour 4: Demo Polish
- [ ] Node animations (fade in, pulse on creation)
- [ ] Edge animations (draw-in effect)
- [ ] Color scheme for node types (idea=blue, challenge=red, action=green, question=purple)
- [ ] Minimap in corner
- [ ] Error handling (graceful fallback if LLM fails)
- [ ] Run through demo script 2-3 times
- [ ] Record backup video in case of live demo issues

---

## System Prompt (Brainstorm Mode)

```
You are BrainFlow, an AI brainstorming partner. You help users explore ideas visually on an infinite canvas.

RULES:
- Generate ideas as nodes using the add_node tool. Each node should have a short label (3-6 words) and optional one-sentence description.
- Connect related ideas using add_edge.
- When asked to expand, generate 3-5 child nodes for the specified parent.
- When asked to challenge, add counter-arguments as challenge-type nodes (red).
- When asked to find connections, look for non-obvious relationships between distant nodes and add edges.
- When asked to prioritize, score each node 1-10 and assign green (>7), yellow (4-7), or red (<4).
- Always think step by step. Explain your reasoning briefly in text messages before adding nodes.
- Generate nodes ONE AT A TIME so the user can see them stream in.
- Be creative, divergent, and surprising. Don't just list obvious ideas.

CURRENT GRAPH STATE:
{graph_state}

USER REQUEST:
{user_prompt}
```

---

## Key Files Structure

```
brainflow/
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Main app with React Flow canvas
│   │   ├── components/
│   │   │   ├── MindMapNode.tsx     # Custom node component
│   │   │   ├── PromptInput.tsx     # Bottom input bar
│   │   │   ├── ActionBar.tsx       # Expand/Challenge/Connect/Prioritize buttons
│   │   │   ├── AgentStatus.tsx     # Thinking indicator + reasoning
│   │   │   └── ModeSelector.tsx    # Agent mode dropdown
│   │   ├── hooks/
│   │   │   └── useAgentStream.ts   # SSE consumer → canvas state updates
│   │   ├── store/
│   │   │   └── canvasStore.ts      # Zustand store for nodes/edges
│   │   └── utils/
│   │       └── layout.ts           # dagre layout helper
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── backend/
│   ├── main.py                     # FastAPI app + SSE endpoint
│   ├── agent.py                    # LLM integration + tool handling
│   ├── events.py                   # AG-UI event types + SSE encoding
│   ├── prompts.py                  # System prompts per mode
│   └── requirements.txt
└── plan/
    └── BRAINFLOW.md                # This file
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| LLM doesn't produce valid tool calls | Pre-test prompts. Have 2-3 hardcoded fallback responses ready |
| React Flow layout janky | Use dagre with generous spacing. Pre-calculate positions if needed |
| SSE connection drops | Reconnect logic. For demo, refresh is fine |
| Demo runs too slow | Pre-warm the LLM. Use a fast model (Claude Haiku / GPT-4o-mini for speed) |
| Node JSON parsing fails | Robust try/catch. Skip malformed nodes gracefully |
| Time runs out | Prioritize: Bloom + Expand + Challenge are the must-haves. Mode switch and Prioritize are nice-to-haves |

---

## Success Criteria

The demo is successful if judges see:
1. ✅ Nodes streaming onto canvas in real-time (not appearing all at once)
2. ✅ User interaction that changes the agent's behavior (click → expand)
3. ✅ Visual differentiation (node types, colors, edge styles)
4. ✅ The "generative" aspect — every run produces different output
5. ✅ Clear AG-UI protocol usage (streaming events, not REST polling)
6. ✅ At least one "surprise" moment (unexpected connection or challenge)
