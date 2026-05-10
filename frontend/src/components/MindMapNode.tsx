import { useState, useEffect } from "react"
import { Handle, Position, type NodeProps } from "@xyflow/react"
import { Target, FolderOpen, Lightbulb, Zap, Wrench, HelpCircle, FileText } from "lucide-react"
import type { MindMapNodeData } from "../store/canvasStore"

// Strong, saturated colors for maximum visual differentiation
const NODE_STYLES: Record<string, { border: string; bg: string; badge: string; Icon: typeof Target }> = {
  topic: {
    border: "#F59E0B",
    bg: "bg-amber-900/30 border-amber-500/50",
    badge: "bg-amber-500 text-white",
    Icon: Target,
  },
  theme: {
    border: "#6366F1",
    bg: "bg-indigo-900/30 border-indigo-500/50",
    badge: "bg-indigo-500 text-white",
    Icon: FolderOpen,
  },
  idea: {
    border: "#FBBF24",
    bg: "bg-amber-900/15 border-amber-400/30",
    badge: "bg-amber-400 text-amber-900",
    Icon: Lightbulb,
  },
  challenge: {
    border: "#EF4444",
    bg: "bg-red-900/30 border-red-500/50",
    badge: "bg-red-500 text-white",
    Icon: Zap,
  },
  action: {
    border: "#10B981",
    bg: "bg-emerald-900/30 border-emerald-500/50",
    badge: "bg-emerald-500 text-white",
    Icon: Wrench,
  },
  question: {
    border: "#A855F7",
    bg: "bg-purple-900/30 border-purple-500/50",
    badge: "bg-purple-500 text-white",
    Icon: HelpCircle,
  },
  detail: {
    border: "#64748B",
    bg: "bg-slate-800/30 border-slate-500/40",
    badge: "bg-slate-500 text-white",
    Icon: FileText,
  },
}

function getScoreColor(score: number): string {
  if (score >= 7) return "bg-green-500"
  if (score >= 4) return "bg-yellow-500"
  return "bg-red-500"
}

function MindMapNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as MindMapNodeData
  const nodeType = nodeData.nodeType || "idea"
  const style = NODE_STYLES[nodeType] || NODE_STYLES.idea
  const { Icon } = style

  const sizeClass = nodeType === "topic"
    ? "min-w-[240px] max-w-[300px]"
    : nodeType === "theme"
    ? "min-w-[210px] max-w-[270px]"
    : "min-w-[180px] max-w-[240px]"

  const [isNew, setIsNew] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsNew(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`relative ${sizeClass} rounded-xl shadow-lg border ${style.bg} backdrop-blur-sm animate-fade-in ${
        isNew ? "animate-pulse-new" : ""
      } ${selected ? "ring-2 ring-amber-400/70 shadow-xl shadow-amber-500/20" : ""}`}
      style={{ borderLeftWidth: "5px", borderLeftColor: style.border }}
    >
      <Handle type="target" position={Position.Top} className="!bg-gray-400 !w-2 !h-2" />

      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
            <Icon size={10} />
            {nodeType.toUpperCase()}
          </span>
          {nodeData.score !== undefined && (
            <span
              className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold text-white ${getScoreColor(nodeData.score)}`}
            >
              {nodeData.score}
            </span>
          )}
        </div>

        <h3 className={`font-bold text-white leading-tight mt-1 ${
          nodeType === "topic" ? "text-base" : "text-sm"
        }`}>
          {nodeData.label}
        </h3>

        {nodeData.description && (
          <p className="text-[11px] text-gray-300 mt-1.5 line-clamp-2 leading-relaxed">
            {nodeData.description}
          </p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-gray-400 !w-2 !h-2" />
    </div>
  )
}

export default MindMapNode
