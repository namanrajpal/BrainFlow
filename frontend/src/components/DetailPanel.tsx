import { useState } from "react"
import { Bookmark, Sparkles, FileText, Zap } from "lucide-react"
import { useCopilotChat } from "@copilotkit/react-core"
import { TextMessage, Role } from "@copilotkit/runtime-client-gql"
import { useCanvasStore } from "../store/canvasStore"
import { useElaborationStore } from "../store/elaborationStore"

const NODE_TYPE_LABELS: Record<string, string> = {
  topic: "Topic",
  theme: "Theme",
  idea: "Idea",
  challenge: "Challenge",
  action: "Action Step",
  question: "Question",
  detail: "Detail",
}

const NODE_TYPE_COLORS: Record<string, string> = {
  topic: "border-amber-500",
  theme: "border-indigo-500",
  idea: "border-blue-500",
  challenge: "border-red-500",
  action: "border-green-500",
  question: "border-purple-500",
  detail: "border-gray-500",
}

function DetailPanel() {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)
  const { appendMessage, isLoading } = useCopilotChat()
  const [saved, setSaved] = useState(false)

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null

  if (!selectedNode) return null

  const nodeData = selectedNode.data
  const borderColor = NODE_TYPE_COLORS[nodeData.nodeType] || "border-gray-500"
  const label = nodeData.label
  const nodeId = selectedNode.id

  // Find parent and children
  const parentEdge = edges.find((e) => e.target === selectedNode.id)
  const parentNode = parentEdge ? nodes.find((n) => n.id === parentEdge.source) : null
  const childEdges = edges.filter((e) => e.source === selectedNode.id)
  const childNodes = childEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean)

  const sendAction = (prompt: string) => {
    const snapshot = useCanvasStore.getState().getGraphSnapshot()
    const currentMode = useCanvasStore.getState().currentMode
    appendMessage(
      new TextMessage({
        content: `[Mode: ${currentMode}] ${prompt}\n\nCurrent graph:\n${JSON.stringify(snapshot)}`,
        role: Role.User,
      })
    )
  }

  const handleElaborate = () => {
    useElaborationStore.getState().setElaboration({
      nodeId,
      title: `${label} — Deep Analysis`,
      summary: "Generating comprehensive analysis...",
      sections: [],
    })
    sendAction(`Elaborate deeply on node '${label}' (id: ${nodeId}). Call elaborate_node MULTIPLE TIMES with node_id="${nodeId}", title="${label} — Deep Analysis". Generate 4 calls with 2 sections each covering: Executive Summary, Why Now, How It Works, Key Components, Market Opportunity, Success Metrics, Risks & Mitigations, Implementation Roadmap.`)
  }

  const handleExpand = () => {
    sendAction(`Expand node '${label}' with 3-5 child ideas`)
  }

  const handleChallenge = () => {
    sendAction(`Challenge node '${label}' — find risks and counter-arguments`)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={`fixed top-16 right-4 z-40 w-80 bg-gray-900/95 backdrop-blur-md border-l-4 ${borderColor} border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700/50">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
          {NODE_TYPE_LABELS[nodeData.nodeType] || nodeData.nodeType}
        </span>
        {nodeData.score !== undefined && (
          <span className={`ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white ${
            nodeData.score >= 7 ? "bg-green-500" : nodeData.score >= 4 ? "bg-yellow-500" : "bg-red-500"
          }`}>
            {nodeData.score}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3 max-h-[35vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-100 leading-snug">
          {nodeData.label}
        </h3>

        {nodeData.description ? (
          <p className="text-sm text-gray-300 mt-3 leading-relaxed whitespace-pre-wrap">
            {nodeData.description}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-3 italic">No description yet. Try elaborating this node.</p>
        )}

        {/* Relationships */}
        {parentNode && (
          <div className="mt-4 pt-3 border-t border-gray-700/50">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">Parent</p>
            <p className="text-xs text-gray-400">↑ {parentNode.data.label}</p>
          </div>
        )}

        {childNodes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1">
              Children ({childNodes.length})
            </p>
            {childNodes.map((child) => (
              <p key={child!.id} className="text-xs text-gray-400 mt-1">
                ↓ {child!.data.label}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 py-3 border-t border-gray-700/50 space-y-2">
        {/* Quick actions row */}
        <div className="flex gap-2">
          <button
            onClick={handleElaborate}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-900/40 hover:bg-cyan-800/50 text-cyan-300 text-[11px] font-medium rounded-lg border border-cyan-700/30 transition-colors disabled:opacity-40"
          >
            <FileText size={12} />
            Elaborate
          </button>
          <button
            onClick={handleExpand}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-900/40 hover:bg-blue-800/50 text-blue-300 text-[11px] font-medium rounded-lg border border-blue-700/30 transition-colors disabled:opacity-40"
          >
            <Sparkles size={12} />
            Expand
          </button>
          <button
            onClick={handleChallenge}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-900/40 hover:bg-red-800/50 text-red-300 text-[11px] font-medium rounded-lg border border-red-700/30 transition-colors disabled:opacity-40"
          >
            <Zap size={12} />
            Challenge
          </button>
        </div>

        {/* Save for later — bigger button */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-medium rounded-lg border border-gray-600 transition-colors"
        >
          <Bookmark size={14} />
          {saved ? "Saved!" : "Save for Later"}
        </button>
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/50">
        <p className="text-[10px] text-gray-500">Right-click for more actions</p>
      </div>
    </div>
  )
}

export default DetailPanel
