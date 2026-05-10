# BrainFlow — Implementation Plan (Win the Hackathon)

## Philosophy

**Visuals first. Protocol second. Polish over features.**

The judges see the frontend for 2.5 minutes. They don't inspect backend code. Every decision optimizes for:
1. Does it look amazing on screen?
2. Does it stream/animate (not pop in statically)?
3. Can we explain it in one sentence?

---

## Stack (Final)

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React + Vite + TypeScript | Fast HMR, we know it |
| Canvas | `@xyflow/react` (React Flow v12) | Best node-graph library, built-in animations |
| Layout | `dagre` | Auto-tree layout, instant position calculation |
| Styling | Tailwind CSS + custom CSS animations | Fast to write, beautiful defaults |
| State | Zustand | Lightweight, no boilerplate |
| SSE Client | Native `fetch` + ReadableStream | No deps, full control over event parsing |
| Backend | Python FastAPI | Matches AG-UI SDK, async streaming |
| AG-UI | `ag-ui-protocol` (PyPI) | Official SDK — EventEncoder, typed events |
| LLM | Anthropic Claude API (streaming) | Best tool-calling, we have keys |
| ACP | Lightweight session wrapper | Just enough to show mode-switching story |

---

## AG-UI Event Flow (The Core)

```
Frontend                         Backend (FastAPI)                    LLM (Claude)
   │                                  │                                  │
   │── POST /api/run ────────────────▶│                                  │
   │   {thread_id, run_id,            │── stream tool_use ──────────────▶│
   │    state: {nodes, edges},        │                                  │
   │    messages: [...],              │◀── tool_use chunk ───────────────│
   │    tools: [add_node, ...]}       │                                  │
   │                                  │                                  │
   │◀── SSE: RUN_STARTED ────────────│                                  │
   │◀── SSE: TEXT_MESSAGE_START ──────│                                  │
   │◀── SSE: TEXT_MESSAGE_CONTENT ────│  (agent reasoning)               │
   │◀── SSE: TEXT_MESSAGE_END ────────│                                  │
   │◀── SSE: TOOL_CALL_START ─────────│  (add_node starting)             │
   │◀── SSE: TOOL_CALL_ARGS ─────────│  (streaming JSON args)           │
   │◀── SSE: TOOL_CALL_END ──────────│  (node complete → render it)     │
   │◀── SSE: TOOL_CALL_START ─────────│  (next node...)                  │
   │◀── SSE: TOOL_CALL_ARGS ─────────│                                  │
   │◀── SSE: TOOL_CALL_END ──────────│                                  │
   │◀── SSE: RUN_FINISHED ───────────│                                  │
   │                                  │                                  │
```

**Key insight:** We render the node on `TOOL_CALL_END` (not during ARGS streaming). During `TOOL_CALL_START` → `TOOL_CALL_ARGS` we show a pulsing ghost placeholder. This avoids partial-JSON parsing bugs while still giving the streaming visual effect.

---

## ACP Session Model (Keep It Simple)

**One sentence:** "Each agent mode is an ACP session; switching modes hands the canvas to a new agent."

```
Session = {
  session_id: string,
  agent_mode: "brainstorm" | "architect" | "critic" | "researcher",
  history: Message[],         // conversation within this mode
  created_at: timestamp
}
```

**Lifecycle:**
1. User opens BrainFlow → session created with mode="brainstorm"
2. Each action (type prompt, expand, challenge) → new `run` within same session
3. Conversation history accumulates (agent remembers what it explored)
4. User switches mode → current session ends, new session starts with same graph state but fresh history
5. New agent gets a one-line summary: "Previous agent explored: [node labels]. Continue from here."

**Implementation (hackathon):**
- Backend holds session in memory (dict keyed by session_id)
- Session stores: mode, message history, current graph snapshot
- Mode switch = new session_id, carry over graph state, reset history
- For demo: we just swap the system prompt. Same LLM, different personality.

**For the pitch:**
> "In production, each mode is a separate ACP agent — a Perplexity-style researcher, a coding architect, a red-team critic. The AG-UI protocol means the canvas doesn't change. Any agent that speaks AG-UI can drive this canvas."

---

## Visual Design (Priority #1)

### Color System

| Node Type | Background | Border | Badge |
|-----------|-----------|--------|-------|
| `idea` | `#EFF6FF` (blue-50) | `#3B82F6` (blue-500) | 💡 Idea |
| `detail` | `#F0FDF4` (green-50) | `#22C55E` (green-500) | 📋 Detail |
| `question` | `#FDF4FF` (purple-50) | `#A855F7` (purple-500) | ❓ Question |
| `challenge` | `#FEF2F2` (red-50) | `#EF4444` (red-500) | ⚡ Challenge |
| `action` | `#FFFBEB` (amber-50) | `#F59E0B` (amber-500) | ✅ Action |
| `root` | `#1E293B` (slate-800) | `#3B82F6` (blue-500) | 🎯 Topic |

### Animations (CSS keyframes — cheap, dramatic)

```css
/* Node appearing */
@keyframes nodeBloom {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

/* Ghost placeholder pulsing while agent streams */
@keyframes ghostPulse {
  0%, 100% { opacity: 0.3; border-color: #94A3B8; }
  50% { opacity: 0.6; border-color: #3B82F6; }
}

/* Edge drawing in */
@keyframes edgeDraw {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}

/* Priority score appearing */
@keyframes scorePop {
  0% { transform: scale(0) rotate(-10deg); }
  100% { transform: scale(1) rotate(0deg); }
}

/* Canvas border glow when agent is thinking */
@keyframes canvasGlow {
  0%, 100% { box-shadow: inset 0 0 20px rgba(59, 130, 246, 0); }
  50% { box-shadow: inset 0 0 20px rgba(59, 130, 246, 0.15); }
}
```

### Node Component Design

```
┌─────────────────────────────────┐
│ 💡 Idea                    ┊ ⋯ │  ← badge + type + context menu
├─────────────────────────────────┤
│ Smart Invoicing             │  ← title (bold, 14px)
│                                 │
│ Auto-detect billable hours  │  ← description (muted, 12px)
│ from calendar & email       │
├─────────────────────────────────┤
│ [Expand] [Challenge]        │  ← action buttons (show on hover/select)
└─────────────────────────────────┘
```

Width: 240px. Rounded corners (12px). Subtle shadow. Colored left border (4px).

---

## File Structure

```
brainflow/
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                    # Canvas + panels layout
│   │   ├── components/
│   │   │   ├── Canvas.tsx             # React Flow wrapper
│   │   │   ├── MindMapNode.tsx        # Custom node with type styling
│   │   │   ├── GhostNode.tsx          # Pulsing placeholder during streaming
│   │   │   ├── AnimatedEdge.tsx       # Edge with draw-in animation
│   │   │   ├── PromptBar.tsx          # Bottom input (centered, minimal)
│   │   │   ├── ActionBar.tsx          # Context actions on selected node
│   │   │   ├── ModeSelector.tsx       # Dropdown: Brainstorm/Architect/Critic
│   │   │   ├── AgentStatus.tsx        # "Thinking..." + reasoning text
│   │   │   └── WelcomeOverlay.tsx     # Empty state with example prompts
│   │   ├── hooks/
│   │   │   ├── useAgentStream.ts      # SSE consumer → dispatches to store
│   │   │   └── useAutoLayout.ts       # dagre layout + animation on change
│   │   ├── store/
│   │   │   └── canvasStore.ts         # Zustand: nodes, edges, session, status
│   │   ├── lib/
│   │   │   ├── agui-client.ts         # SSE fetch, event parsing, types
│   │   │   └── layout.ts             # dagre wrapper
│   │   ├── types/
│   │   │   └── index.ts              # Node types, event types, session types
│   │   └── styles/
│   │       └── animations.css         # All keyframe animations
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── backend/
│   ├── main.py                        # FastAPI app, CORS, routes
│   ├── agent.py                       # LLM call + streaming tool parsing
│   ├── events.py                      # AG-UI event emission helpers
│   ├── session.py                     # In-memory session store
│   ├── prompts.py                     # System prompts per mode
│   ├── tools.py                       # Tool definitions for Claude
│   └── requirements.txt
└── plan/
    ├── BRAINFLOW.md
    └── IMPLEMENTATION.md              # This file
```

---

## Backend Implementation Details

### POST /api/run (main endpoint)

```python
@app.post("/api/run")
async def run_agent(input_data: RunAgentInput, request: Request):
    encoder = EventEncoder()
    session = get_or_create_session(input_data.thread_id)
    
    async def stream():
        # 1. Emit RUN_STARTED
        yield encoder.encode(RunStartedEvent(...))
        
        # 2. Build messages for Claude
        messages = build_messages(session, input_data)
        
        # 3. Stream Claude response
        async with anthropic_client.messages.stream(
            model="claude-sonnet-4-20250514",
            system=get_system_prompt(session.mode),
            messages=messages,
            tools=TOOL_DEFINITIONS,
            max_tokens=4096,
        ) as stream:
            async for event in stream:
                if event.type == "content_block_start":
                    if event.content_block.type == "tool_use":
                        yield encoder.encode(ToolCallStartEvent(
                            tool_call_id=event.content_block.id,
                            tool_call_name=event.content_block.name,
                        ))
                        accumulated_json = ""
                
                elif event.type == "content_block_delta":
                    if event.delta.type == "input_json_delta":
                        accumulated_json += event.delta.partial_json
                        yield encoder.encode(ToolCallArgsEvent(
                            tool_call_id=current_tool_id,
                            delta=event.delta.partial_json,
                        ))
                    elif event.delta.type == "text_delta":
                        yield encoder.encode(TextMessageContentEvent(
                            message_id=msg_id,
                            delta=event.delta.text,
                        ))
                
                elif event.type == "content_block_stop":
                    if current_block_is_tool:
                        yield encoder.encode(ToolCallEndEvent(
                            tool_call_id=current_tool_id,
                        ))
        
        # 4. Emit RUN_FINISHED
        yield encoder.encode(RunFinishedEvent(...))
    
    return StreamingResponse(stream(), media_type="text/event-stream")
```

### Tool Definitions (for Claude)

```python
TOOL_DEFINITIONS = [
    {
        "name": "add_node",
        "description": "Add a new idea node to the brainstorm canvas",
        "input_schema": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "Unique node ID (e.g., 'n1', 'n2')"},
                "label": {"type": "string", "description": "Short title, 3-6 words max"},
                "description": {"type": "string", "description": "One sentence elaboration"},
                "parent_id": {"type": "string", "description": "Parent node ID. Use 'root' for top-level nodes."},
                "node_type": {
                    "type": "string",
                    "enum": ["idea", "detail", "question", "challenge", "action"],
                },
            },
            "required": ["id", "label", "parent_id", "node_type"],
        },
    },
    {
        "name": "add_edge",
        "description": "Connect two existing nodes with a labeled relationship (for non-obvious connections)",
        "input_schema": {
            "type": "object",
            "properties": {
                "source": {"type": "string"},
                "target": {"type": "string"},
                "label": {"type": "string", "description": "Relationship description"},
            },
            "required": ["source", "target"],
        },
    },
    {
        "name": "challenge_node",
        "description": "Add a counter-argument or risk to an existing idea",
        "input_schema": {
            "type": "object",
            "properties": {
                "target_id": {"type": "string"},
                "challenge_text": {"type": "string"},
                "severity": {"type": "string", "enum": ["low", "medium", "high"]},
            },
            "required": ["target_id", "challenge_text", "severity"],
        },
    },
    {
        "name": "prioritize_nodes",
        "description": "Score and rank nodes by feasibility/impact",
        "input_schema": {
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
                            "reason": {"type": "string"},
                        },
                        "required": ["node_id", "score", "color"],
                    },
                },
            },
            "required": ["scores"],
        },
    },
]
```

### System Prompts

```python
PROMPTS = {
    "brainstorm": """You are BrainFlow, a creative AI brainstorming partner. You help users explore ideas on a visual canvas.

RULES:
- Generate ideas using add_node. Each node has a short label (3-6 words) and one-sentence description.
- Add parent-child relationships by setting parent_id.
- Generate nodes ONE AT A TIME so they stream visually.
- Be creative, divergent, surprising. Don't list obvious ideas.
- Start with 4-6 varied nodes covering different angles.
- Before adding nodes, briefly explain your thinking in a text message.

CURRENT CANVAS STATE:
{graph_state}""",

    "architect": """You are BrainFlow in Architect mode. You think in systems, structures, and implementations.

RULES:
- Generate nodes that represent technical components, services, APIs, data flows.
- Use node_type="action" for implementable steps, "detail" for specifications.
- Think about feasibility, dependencies, and order of operations.
- Generate nodes ONE AT A TIME.
- Build on existing nodes — add technical depth to what's already on canvas.

CURRENT CANVAS STATE:
{graph_state}""",

    "critic": """You are BrainFlow in Critic mode. You are a constructive devil's advocate.

RULES:
- Use challenge_node to add counter-arguments to existing ideas.
- Use add_node with node_type="question" for open questions that need answers.
- Be specific about WHY something might fail. No generic criticism.
- Generate challenges ONE AT A TIME for dramatic effect.
- After challenging, optionally suggest a mitigation as an "action" node.

CURRENT CANVAS STATE:
{graph_state}""",

    "researcher": """You are BrainFlow in Researcher mode. You think in evidence, examples, and references.

RULES:
- Add "detail" nodes with specific data points, market sizes, examples.
- Add "question" nodes for things that need validation.
- Reference real companies, products, or research when relevant.
- Generate nodes ONE AT A TIME.
- Connect insights to existing ideas using add_edge when you find relationships.

CURRENT CANVAS STATE:
{graph_state}""",
}
```

---

## Frontend Implementation Details

### AG-UI SSE Client (`lib/agui-client.ts`)

```typescript
import { EventType } from '../types';

export interface AGUIEvent {
  type: EventType;
  [key: string]: any;
}

export async function streamRun(
  prompt: string,
  graphState: { nodes: any[]; edges: any[] },
  sessionId: string,
  mode: string,
  onEvent: (event: AGUIEvent) => void,
): Promise<void> {
  const response = await fetch('http://localhost:8000/api/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      thread_id: sessionId,
      run_id: crypto.randomUUID(),
      state: graphState,
      messages: [{ id: crypto.randomUUID(), role: 'user', content: prompt }],
      tools: [],
      context: [],
      forwarded_props: { mode },
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6);
        try {
          const event = JSON.parse(json) as AGUIEvent;
          onEvent(event);
        } catch (e) {
          // skip malformed events
        }
      }
    }
  }
}
```

### Zustand Store (`store/canvasStore.ts`)

```typescript
interface CanvasState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  ghostNodes: string[];           // IDs of placeholder nodes being streamed
  sessionId: string;
  mode: 'brainstorm' | 'architect' | 'critic' | 'researcher';
  agentStatus: 'idle' | 'thinking' | 'streaming';
  reasoningText: string;
  
  // Actions
  addNode: (node: MindMapNode) => void;
  addGhostNode: (id: string, toolName: string) => void;
  finalizeGhostNode: (id: string, data: NodeData) => void;
  addEdge: (edge: MindMapEdge) => void;
  setMode: (mode: string) => void;
  setAgentStatus: (status: string) => void;
  appendReasoning: (text: string) => void;
  updateNodeScores: (scores: ScoreUpdate[]) => void;
}
```

### Event Handler (in `useAgentStream.ts`)

```typescript
function handleEvent(event: AGUIEvent) {
  switch (event.type) {
    case 'RUN_STARTED':
      store.setAgentStatus('thinking');
      break;
      
    case 'TEXT_MESSAGE_CONTENT':
      store.setAgentStatus('thinking');
      store.appendReasoning(event.delta);
      break;
      
    case 'TOOL_CALL_START':
      store.setAgentStatus('streaming');
      store.addGhostNode(event.toolCallId, event.toolCallName);
      // Start accumulating JSON args
      argsBuffer[event.toolCallId] = '';
      break;
      
    case 'TOOL_CALL_ARGS':
      argsBuffer[event.toolCallId] += event.delta;
      break;
      
    case 'TOOL_CALL_END':
      // Parse accumulated JSON, render the real node
      const args = JSON.parse(argsBuffer[event.toolCallId]);
      handleToolResult(event.toolCallId, toolNames[event.toolCallId], args);
      delete argsBuffer[event.toolCallId];
      break;
      
    case 'RUN_FINISHED':
      store.setAgentStatus('idle');
      store.clearReasoning();
      break;
  }
}

function handleToolResult(toolCallId: string, toolName: string, args: any) {
  switch (toolName) {
    case 'add_node':
      store.finalizeGhostNode(toolCallId, {
        id: args.id,
        label: args.label,
        description: args.description,
        nodeType: args.node_type,
        parentId: args.parent_id,
      });
      // Auto-add edge from parent
      if (args.parent_id && args.parent_id !== 'root') {
        store.addEdge({ source: args.parent_id, target: args.id });
      }
      break;
      
    case 'challenge_node':
      // Create a challenge node attached to target
      store.addNode({
        id: `challenge-${toolCallId}`,
        label: args.challenge_text,
        nodeType: 'challenge',
        parentId: args.target_id,
        severity: args.severity,
      });
      store.addEdge({ source: args.target_id, target: `challenge-${toolCallId}` });
      break;
      
    case 'add_edge':
      store.addEdge({ source: args.source, target: args.target, label: args.label });
      break;
      
    case 'prioritize_nodes':
      store.updateNodeScores(args.scores);
      break;
  }
}
```

---

## Build Schedule (4 Hours — Minute by Minute)

### Hour 1 (0:00–1:00): Skeleton That Renders

| Time | Task | Done When |
|------|------|-----------|
| 0:00–0:10 | Scaffold: `npm create vite`, install deps, tailwind init | `npm run dev` shows blank page |
| 0:10–0:25 | React Flow canvas with 3 hardcoded nodes + edges | Nodes visible, draggable |
| 0:25–0:40 | Custom MindMapNode component with type-based colors | Nodes look good (colored borders, badges) |
| 0:40–0:50 | FastAPI backend with hardcoded SSE stream | `curl` returns event stream |
| 0:50–1:00 | Connect frontend SSE client to backend | Hardcoded nodes stream onto canvas |

**Checkpoint:** Nodes appear one-by-one from backend. No LLM yet.

### Hour 2 (1:00–2:00): LLM Integration

| Time | Task | Done When |
|------|------|-----------|
| 1:00–1:20 | Claude API streaming with tool_use | Backend logs streamed tool calls |
| 1:20–1:35 | Map Claude tool stream → AG-UI events | Frontend renders LLM-generated nodes |
| 1:35–1:45 | Prompt input bar on frontend | Type topic → nodes bloom |
| 1:45–2:00 | dagre auto-layout on new nodes | Nodes auto-position, no overlaps |

**Checkpoint:** Type any topic → AI-generated mind map streams onto canvas. THE CORE DEMO WORKS.

### Hour 3 (2:00–3:00): Interactions

| Time | Task | Done When |
|------|------|-----------|
| 2:00–2:15 | Node selection + Expand button | Click node → Expand → child nodes stream in |
| 2:15–2:30 | Challenge button | Click → red challenge nodes appear |
| 2:30–2:45 | Mode selector (Brainstorm/Architect/Critic) | Switch → different node types generated |
| 2:45–3:00 | Agent status panel (reasoning text streams) | See "Thinking about..." while agent works |

**Checkpoint:** All interactive features work. Demo script is executable.

### Hour 4 (3:00–4:00): Polish & Demo Prep

| Time | Task | Done When |
|------|------|-----------|
| 3:00–3:15 | CSS animations (nodeBloom, ghostPulse, edgeDraw) | Nodes animate in beautifully |
| 3:15–3:25 | Canvas glow effect when agent is active | Subtle blue border glow |
| 3:25–3:35 | Prioritize button + node recoloring | Scores appear, colors change |
| 3:35–3:45 | Welcome overlay (empty state with example prompts) | New users know what to do |
| 3:45–3:50 | Find Connections button (optional) | Dotted edges across branches |
| 3:50–4:00 | Demo rehearsal × 2. Record backup video. | Ready to present |

---

## Critical Path (If Running Behind)

**Must have (Minimum Viable Demo):**
1. Prompt → nodes stream onto canvas (The Bloom)
2. Click node → Expand (The Deep Dive)
3. Challenge button (The Challenge)
4. Animations on node creation

**Nice to have:**
5. Mode switching
6. Agent reasoning panel
7. Prioritize
8. Find Connections
9. Welcome overlay

If at 2:00 the core streaming doesn't work, STOP adding features and fix streaming.

---

## Demo Script (Refined for Max Impact)

### Setup
- Dark browser (system dark mode off — light canvas pops better on projector)
- Canvas is empty except for a subtle "What do you want to brainstorm?" prompt
- Mode selector shows "Brainstorm"

### Script (2:20)

**[0:00–0:10] Hook**
> "Every brainstorm starts the same way — you stare at a blank page. BrainFlow is an AI that thinks WITH you, visually."

**[0:10–0:35] The Bloom** (wow moment #1)
> Type: "AI tools for freelancers who hate admin work"
> Canvas glows blue. Agent status: "Exploring angles..."
> 5 nodes bloom onto canvas one by one. Each fades in, grows, connects.
> Pause to let judges absorb.

**[0:35–0:55] The Deep Dive** (wow moment #2)
> Click "Smart Invoicing" → hit Expand
> 3 child nodes stream in underneath
> "The agent goes deeper where I point."

**[0:55–1:15] The Challenge** (wow moment #3)
> Select "Smart Invoicing" → hit Challenge
> Red nodes appear: "Stripe already dominates", "Low margin"
> "It pressure-tests my ideas without me asking leading questions."

**[1:15–1:40] The Mode Switch** (wow moment #4)
> Switch to "Architect"
> New technical nodes appear on existing canvas: "Event-driven pipeline", "Email parser service"
> "Same canvas, different thinker. In production, this is a separate ACP agent."

**[1:40–2:00] The Prioritize** (wow moment #5)
> Hit Prioritize
> Nodes recolor green/yellow/red. Scores pop in.
> "Now I know where to focus."

**[2:00–2:20] Close**
> "Under the hood: AG-UI protocol streaming events. Each node is a tool call rendered as generative UI. The canvas is universal — any AG-UI agent can drive it. Thank you."

---

## Things That Make Judges Go "Wow" (Visual Details)

1. **Canvas glow** — subtle animated border when agent is active
2. **Ghost nodes** — pulsing translucent placeholders appear BEFORE content arrives
3. **Bloom animation** — nodes scale from 0 to 1.1 to 1.0 (overshoot = organic feel)
4. **Edge draw-in** — edges animate from source to target (stroke-dasharray trick)
5. **Score pop** — priority scores bounce in with spring physics
6. **Type badges** — colored pills on each node (💡 Idea, ⚡ Challenge, ✅ Action)
7. **Reasoning panel** — small italic text streaming at bottom ("Thinking about invoice automation approaches...")
8. **Smooth layout transitions** — when new nodes appear, existing nodes slide to make room (React Flow + dagre recalc with CSS transition on position)

---

## Error Handling (Demo-Safe)

| Failure | Recovery |
|---------|----------|
| LLM timeout | Show "Agent is taking longer..." → auto-retry once |
| Malformed tool JSON | Skip that node, continue stream. Log to console. |
| SSE disconnect | Auto-reconnect. Show brief "Reconnecting..." |
| Layout overlap | Increase dagre node separation. Fallback: random offset |
| Rate limit | Use Claude Haiku as backup model |

**Nuclear option:** If everything breaks during demo, have a pre-recorded 30-second video of the happy path ready on a different tab.

---

## Environment Setup (Pre-Hackathon)

```bash
# Frontend
cd brainflow/frontend
npm create vite@latest . -- --template react-ts
npm install @xyflow/react dagre @types/dagre zustand tailwindcss @tailwindcss/vite

# Backend  
cd brainflow/backend
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn anthropic ag-ui-protocol

# Env vars needed
export ANTHROPIC_API_KEY=sk-...
```

---

## What We're NOT Building (Scope Cuts)

- No persistence / database
- No user auth
- No export (PDF, image)
- No collaborative / multi-user
- No undo/redo
- No mobile responsive
- No tests
- No CI/CD
- No proper error boundaries (just try/catch)
- No ACP subprocess management (just prompt swapping)
- No MCP tool integrations (agent "pretends" to research)

All of these are "production roadmap" items we can mention in the pitch if asked.
