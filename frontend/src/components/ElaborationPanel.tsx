import { useState } from "react"
import { useCopilotChat } from "@copilotkit/react-core"
import { TextMessage, Role } from "@copilotkit/runtime-client-gql"
import { useElaborationStore } from "../store/elaborationStore"
import { useCanvasStore } from "../store/canvasStore"

// Visual elements for different section types
const SECTION_ICONS: Record<string, string> = {
  "Executive Summary": "📋",
  "How It Works": "⚙️",
  "Key Components": "🧩",
  "Market Opportunity": "📈",
  "Implementation Roadmap": "🗺️",
  "Risks & Mitigations": "⚠️",
  "Success Metrics": "🎯",
  "Why Now": "⏰",
}

const SECTION_COLORS = [
  "from-blue-500/20 to-blue-500/5",
  "from-purple-500/20 to-purple-500/5",
  "from-green-500/20 to-green-500/5",
  "from-amber-500/20 to-amber-500/5",
  "from-pink-500/20 to-pink-500/5",
  "from-cyan-500/20 to-cyan-500/5",
  "from-red-500/20 to-red-500/5",
  "from-indigo-500/20 to-indigo-500/5",
]

const DOT_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-green-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-red-500",
  "bg-indigo-500",
]

function ElaborationPanel() {
  const elaboration = useElaborationStore((s) => s.activeElaboration)
  const clearElaboration = useElaborationStore((s) => s.clearElaboration)
  const { appendMessage, isLoading } = useCopilotChat()
  const [followUp, setFollowUp] = useState("")

  if (!elaboration) return null

  const handleFollowUp = () => {
    if (!followUp.trim() || isLoading) return
    const currentMode = useCanvasStore.getState().currentMode
    const snapshot = useCanvasStore.getState().getGraphSnapshot()

    appendMessage(
      new TextMessage({
        content: `[Mode: ${currentMode}] Regarding "${elaboration.title}": ${followUp.trim()}. Use elaborate_node to update the document with new insights based on this question. node_id="${elaboration.nodeId}"\n\nCurrent graph:\n${JSON.stringify(snapshot)}`,
        role: Role.User,
      })
    )
    setFollowUp("")
  }

  return (
    <div className="fixed top-0 right-0 bottom-0 w-[440px] z-[55] bg-gray-950/98 backdrop-blur-xl border-l border-gray-700/80 shadow-2xl overflow-hidden animate-fade-in flex flex-col">
      {/* Header with gradient */}
      <div className="px-5 py-4 border-b border-gray-700/50 shrink-0 bg-gradient-to-r from-purple-900/30 via-blue-900/20 to-gray-900/0">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                AG-UI Generated Document
              </span>
            </div>
            <h2 className="text-lg font-bold text-white leading-tight pr-8">
              {elaboration.title}
            </h2>
          </div>
          <button
            onClick={clearElaboration}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors text-lg leading-none p-1.5 rounded-lg hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-3 border-b border-gray-700/30 shrink-0">
        <p className="text-sm text-gray-300 leading-relaxed">{elaboration.summary}</p>
      </div>

      {/* Section count indicator */}
      <div className="px-5 py-2 border-b border-gray-700/20 shrink-0 flex items-center gap-2">
        <div className="flex gap-1">
          {elaboration.sections.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
          ))}
        </div>
        <span className="text-[10px] text-gray-500">{elaboration.sections.length} sections</span>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {elaboration.sections.map((section, i) => {
          const icon = SECTION_ICONS[section.heading] || "📄"
          const gradientColor = SECTION_COLORS[i % SECTION_COLORS.length]
          const dotColor = DOT_COLORS[i % DOT_COLORS.length]

          return (
            <div key={i} className="rounded-xl border border-gray-700/40 overflow-hidden">
              {/* Section header */}
              <div className={`px-4 py-3 bg-gradient-to-r ${gradientColor} border-b border-gray-700/30 flex items-center gap-2.5`}>
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                <span className="text-base">{icon}</span>
                <h3 className="text-sm font-bold text-white">
                  {section.heading}
                </h3>
              </div>
              {/* Section content */}
              <div className="px-4 py-3 bg-gray-900/30">
                <div className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </div>
              </div>
            </div>
          )
        })}

        {/* Interactive follow-up */}
        <div className="rounded-xl border border-purple-500/30 bg-gradient-to-r from-purple-900/15 to-blue-900/10 p-4 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">💬</span>
            <p className="text-[11px] font-bold text-purple-400 uppercase tracking-wide">
              Ask the agent about this idea
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFollowUp() }}
              placeholder="Go deeper... ask about risks, tech stack, timeline..."
              className="flex-1 text-sm bg-gray-800/80 border border-gray-600 rounded-lg px-3 py-2.5 text-gray-200 placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
            />
            <button
              onClick={handleFollowUp}
              disabled={isLoading || !followUp.trim()}
              className="px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors"
            >
              Ask
            </button>
          </div>
        </div>

        {/* Elaborate Further button */}
        <button
          onClick={() => {
            const currentMode = useCanvasStore.getState().currentMode
            const snapshot = useCanvasStore.getState().getGraphSnapshot()
            appendMessage(
              new TextMessage({
                content: `[Mode: ${currentMode}] Elaborate FURTHER on "${elaboration.title}" (node_id="${elaboration.nodeId}"). The document already has ${elaboration.sections.length} sections. Now add MORE depth by calling elaborate_node again with agent_name="Deep Dive Specialist" and these NEW sections:
- "Technical Architecture" (detailed system design, data flow, API contracts)
- "User Personas" (3 detailed personas with goals, pain points, and how this helps them)
- "Competitive Landscape" (table-style comparison with 3-4 competitors)
- "Go-to-Market Strategy" (launch plan, channels, first 100 users)
- "Financial Model" (cost structure, revenue streams, break-even timeline)

Make each section 3-4 paragraphs with specific details.\n\nCurrent graph:\n${JSON.stringify(snapshot)}`,
                role: Role.User,
              })
            )
          }}
          disabled={isLoading}
          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Generating more sections...
            </span>
          ) : (
            "✨ Elaborate Further — Add More Depth"
          )}
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-gray-700/50 shrink-0 bg-gray-900/50 flex items-center justify-between">
        <p className="text-[10px] text-gray-500">
          Generated via AG-UI • {elaboration.sections.length} sections from multiple agents
        </p>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-[10px] text-green-400">Connected</span>
        </div>
      </div>
    </div>
  )
}

export default ElaborationPanel
