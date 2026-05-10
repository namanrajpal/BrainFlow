import { useState } from "react"
import { useCopilotChat } from "@copilotkit/react-core"
import { TextMessage, Role } from "@copilotkit/runtime-client-gql"
import { Sparkles, FileText, Zap, Link2, BarChart3, Trash2 } from "lucide-react"
import { useCanvasStore } from "../store/canvasStore"
import { useElaborationStore } from "../store/elaborationStore"

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
      sendAction(`Expand node '${label}' with 3-5 child ideas`)
    } else {
      setShowExpandInput(true)
    }
  }

  const actions = [
    {
      id: "expand",
      label: "Expand",
      description: "Add child ideas (click again to customize direction)",
      color: "text-blue-300 hover:bg-blue-900/40",
      Icon: Sparkles,
      action: handleExpand,
    },
    {
      id: "elaborate",
      label: "Elaborate",
      description: "Generate a rich document with deep analysis",
      color: "text-cyan-300 hover:bg-cyan-900/40",
      Icon: FileText,
      action: () => {
        // Open the panel immediately with a loading state
        useElaborationStore.getState().setElaboration({
          nodeId,
          title: `${label} — Deep Analysis`,
          summary: "Generating comprehensive analysis...",
          sections: [],
        })
        sendAction(`Elaborate deeply on node '${label}' (id: ${nodeId}).

Call elaborate_node MULTIPLE TIMES to build up the document progressively. Each call adds new sections. Do this:

FIRST CALL (agent_name="Strategist"): elaborate_node with node_id="${nodeId}", title="${label} — Deep Analysis", summary (3-4 rich sentences about what this is and why it matters), and sections:
- "Executive Summary" (4-5 paragraphs: what this is, the core problem it solves, who benefits, key value proposition, why this approach is unique)
- "Why Now" (3-4 paragraphs: market timing, technology readiness, cultural shifts, competitive window)

SECOND CALL (agent_name="Architect"): elaborate_node with same node_id, title, summary, and sections:
- "How It Works" (4-5 paragraphs: detailed user journey from first touch to power user, system flow, key interactions, feedback loops)
- "Key Components" (list 6-8 building blocks with 2-3 sentence descriptions of each, their responsibilities, and how they connect)

THIRD CALL (agent_name="Market Analyst"): elaborate_node with same node_id, title, summary, and sections:
- "Market Opportunity" (4 paragraphs: total addressable market with numbers, 3-4 real competitors or analogies, clear differentiation, market gaps)
- "Success Metrics" (list 6-8 KPIs with specific target numbers and timeframes, organized by category: growth, engagement, revenue, quality)

FOURTH CALL (agent_name="Risk Advisor"): elaborate_node with same node_id, title, summary, and sections:
- "Risks & Mitigations" (5 risks, each with: description, likelihood, impact, specific mitigation strategy — be thorough)
- "Implementation Roadmap" (Phase 1 MVP (2 weeks): 4-5 deliverables. Phase 2 Beta (1 month): 4-5 features. Phase 3 Scale (3 months): growth strategy. Be specific about what ships when.)

Make each section's content RICH — multiple paragraphs, specific examples, real data points, named technologies. Call elaborate_node 4 separate times.`)
      },
    },
    {
      id: "challenge",
      label: "Challenge",
      description: "Find risks, flaws, and counter-arguments",
      color: "text-red-300 hover:bg-red-900/40",
      Icon: Zap,
      action: () => sendAction(`Challenge node '${label}' — find risks and counter-arguments`),
    },
    {
      id: "connect",
      label: "Find Connections",
      description: "Discover non-obvious links to other nodes",
      color: "text-purple-300 hover:bg-purple-900/40",
      Icon: Link2,
      action: () => sendAction(`Find non-obvious connections from node '${label}' to other distant nodes`),
    },
    {
      id: "prioritize",
      label: "Prioritize All",
      description: "Score all ideas 1-10 by feasibility & impact",
      color: "text-green-300 hover:bg-green-900/40",
      Icon: BarChart3,
      action: () => sendAction("Score each idea node 1-10 by feasibility and impact. Use prioritize_nodes."),
    },
    {
      id: "delete",
      label: "Delete",
      description: "Remove this node from the canvas",
      color: "text-gray-400 hover:bg-gray-800/60",
      Icon: Trash2,
      action: () => sendAction(`Delete node '${label}' (id: ${nodeId}). Use delete_node tool with node_id="${nodeId}".`),
    },
  ]

  return (
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />

      <div
        className="fixed z-[70] bg-gray-900/95 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl py-2 min-w-[240px] animate-fade-in"
        style={{ left: x, top: y }}
      >
        <div className="px-3 py-1.5 border-b border-gray-700/50 mb-1">
          <p className="text-xs text-gray-400 truncate max-w-[220px]">{label}</p>
        </div>

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
            className={`w-full text-left px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-start gap-2.5 ${item.color}`}
          >
            <item.Icon size={14} className="mt-0.5 shrink-0" />
            <div>
              <span className="text-sm font-medium">{item.label}</span>
              <span className="block text-[11px] text-gray-500 mt-0.5">{item.description}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

export default NodeContextMenu
