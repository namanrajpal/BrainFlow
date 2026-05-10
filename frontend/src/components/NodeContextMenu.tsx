import { useState } from "react"
import { useCopilotChat } from "@copilotkit/react-core"
import { TextMessage, Role } from "@copilotkit/runtime-client-gql"
import { useCanvasStore } from "../store/canvasStore"

interface NodeContextMenuProps {
  nodeId: string
  x: number
  y: number
  onClose: () => void
}

function NodeContextMenu({ nodeId, x, y, onClose }: NodeContextMenuProps) {
  const { appendMessage, isLoading } = useCopilotChat()
  const nodes = useCanvasStore((s) => s.nodes)
  const node = nodes.find((n) => n.id === nodeId)
  const label = node?.data.label ?? ""
  const [expandPrompt, setExpandPrompt] = useState("")
  const [showExpandInput, setShowExpandInput] = useState(false)

  const sendAction = async (prompt: string) => {
    const snapshot = useCanvasStore.getState().getGraphSnapshot()
    const currentMode = useCanvasStore.getState().currentMode
    const contextSuffix =
      snapshot.nodes.length > 0
        ? `\n\nCurrent graph:\n${JSON.stringify(snapshot)}`
        : ""

    // Fire and forget — don't await so closing the menu doesn't cancel the agent
    appendMessage(
      new TextMessage({
        content: `[Mode: ${currentMode}] ${prompt}${contextSuffix}`,
        role: Role.User,
      })
    )
    onClose()
  }

  const handleExpand = () => {
    if (showExpandInput && expandPrompt.trim()) {
      sendAction(`Expand node '${label}' in this direction: ${expandPrompt.trim()}`)
    } else if (showExpandInput) {
      // Empty input, use default
      sendAction(`Expand node '${label}' with 3-5 child ideas`)
    } else {
      setShowExpandInput(true)
    }
  }

  const actions = [
    {
      id: "expand",
      label: "✨ Expand",
      description: "Add child ideas (click again to customize direction)",
      color: "text-blue-300 hover:bg-blue-900/40",
      action: handleExpand,
    },
    {
      id: "elaborate",
      label: "📝 Elaborate",
      description: "Generate a rich document with deep analysis",
      color: "text-cyan-300 hover:bg-cyan-900/40",
      action: () => sendAction(`Elaborate deeply on node '${label}' (id: ${nodeId}).

Call elaborate_node MULTIPLE TIMES to build up the document progressively. Each call adds new sections. Do this:

FIRST CALL (agent_name="Strategist"): elaborate_node with node_id="${nodeId}", title="${label} — Deep Analysis", summary (2-3 sentences about what this is), and sections:
- "Executive Summary" (3-4 paragraphs: what, why, who benefits, key value prop)
- "Why Now" (2-3 paragraphs: market timing, tech readiness, trends)

SECOND CALL (agent_name="Architect"): elaborate_node with same node_id, title, summary, and sections:
- "How It Works" (3-4 paragraphs: user journey, system flow, key interactions)
- "Key Components" (list 5-6 building blocks with descriptions)

THIRD CALL (agent_name="Market Analyst"): elaborate_node with same node_id, title, summary, and sections:
- "Market Opportunity" (3 paragraphs: TAM, competitors, differentiation)
- "Success Metrics" (list 5 KPIs with target numbers)

FOURTH CALL (agent_name="Risk Advisor"): elaborate_node with same node_id, title, summary, and sections:
- "Risks & Mitigations" (4 risks with specific mitigation strategies)
- "Implementation Roadmap" (Phase 1/2/3 with timelines and deliverables)

Make each section's content RICH — multiple paragraphs, specific examples, real data. Call elaborate_node 4 separate times.`),
    },
    {
      id: "challenge",
      label: "⚡ Challenge",
      description: "Find risks, flaws, and counter-arguments",
      color: "text-red-300 hover:bg-red-900/40",
      action: () => sendAction(`Challenge node '${label}' — find risks and counter-arguments`),
    },
    {
      id: "connect",
      label: "🔗 Find Connections",
      description: "Discover non-obvious links to other nodes",
      color: "text-purple-300 hover:bg-purple-900/40",
      action: () => sendAction(`Find non-obvious connections from node '${label}' to other distant nodes`),
    },
    {
      id: "prioritize",
      label: "📊 Prioritize All",
      description: "Score all ideas 1-10 by feasibility & impact",
      color: "text-green-300 hover:bg-green-900/40",
      action: () => sendAction("Score each idea node 1-10 by feasibility and impact. Use prioritize_nodes."),
    },
    {
      id: "delete",
      label: "🗑️ Delete",
      description: "Remove this node from the canvas",
      color: "text-gray-400 hover:bg-gray-800/60",
      action: () => sendAction(`Delete node '${label}' (id: ${nodeId}). Use delete_node tool with node_id="${nodeId}".`),
    },
  ]

  return (
    <>
      {/* Backdrop to close menu */}
      <div className="fixed inset-0 z-[60]" onClick={onClose} />

      {/* Context menu */}
      <div
        className="fixed z-[70] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl py-2 min-w-[240px] animate-fade-in"
        style={{ left: x, top: y }}
      >
        {/* Node label header */}
        <div className="px-3 py-1.5 border-b border-gray-700/50 mb-1">
          <p className="text-xs text-gray-400 truncate max-w-[220px]">{label}</p>
        </div>

        {/* Expand with optional custom input */}
        {showExpandInput && (
          <div className="px-3 py-2 border-b border-gray-700/50">
            <input
              type="text"
              value={expandPrompt}
              onChange={(e) => setExpandPrompt(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleExpand() }}
              placeholder="Direction (or Enter for default)..."
              autoFocus
              className="w-full text-sm bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500"
            />
          </div>
        )}

        {actions.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            disabled={isLoading}
            className={`w-full text-left px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${item.color}`}
          >
            <span className="text-sm font-medium">{item.label}</span>
            <span className="block text-[11px] text-gray-500 mt-0.5">{item.description}</span>
          </button>
        ))}
      </div>
    </>
  )
}

export default NodeContextMenu
