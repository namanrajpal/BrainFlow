import { useCanvasStore } from "../store/canvasStore"

const NODE_TYPE_LABELS: Record<string, string> = {
  topic: "🎯 Topic",
  theme: "📂 Theme",
  idea: "💡 Idea",
  challenge: "⚡ Challenge",
  action: "🔧 Action Step",
  question: "❓ Question",
  detail: "📋 Detail",
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

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null

  if (!selectedNode) return null

  const nodeData = selectedNode.data
  const borderColor = NODE_TYPE_COLORS[nodeData.nodeType] || "border-gray-500"

  // Find parent and children
  const parentEdge = edges.find((e) => e.target === selectedNode.id)
  const parentNode = parentEdge ? nodes.find((n) => n.id === parentEdge.source) : null
  const childEdges = edges.filter((e) => e.source === selectedNode.id)
  const childNodes = childEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean)

  return (
    <div className={`fixed top-16 right-4 z-40 w-72 bg-gray-900/95 backdrop-blur-md border-l-4 ${borderColor} border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in`}>
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
      <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-100 leading-snug">
          {nodeData.label}
        </h3>

        {nodeData.description ? (
          <p className="text-sm text-gray-300 mt-3 leading-relaxed whitespace-pre-wrap">
            {nodeData.description}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-3 italic">No description yet. Try expanding this node.</p>
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

      {/* Hint */}
      <div className="px-4 py-2 border-t border-gray-700/50 bg-gray-800/50">
        <p className="text-[10px] text-gray-500">Right-click for actions • Click canvas to close</p>
      </div>
    </div>
  )
}

export default DetailPanel
