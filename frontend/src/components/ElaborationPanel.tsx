import { useState } from "react"
import { useCopilotChat } from "@copilotkit/react-core"
import { TextMessage, Role } from "@copilotkit/runtime-client-gql"
import { ClipboardCopy, Rocket, Sparkles, FileText, Puzzle, TrendingUp, Map, AlertTriangle, Target, Clock, ChevronDown, ChevronRight, PlusCircle } from "lucide-react"
import { useElaborationStore } from "../store/elaborationStore"
import { useCanvasStore } from "../store/canvasStore"

// Visual elements for different section types
const SECTION_ICONS: Record<string, typeof FileText> = {
  "Executive Summary": FileText,
  "How It Works": Puzzle,
  "Key Components": Puzzle,
  "Market Opportunity": TrendingUp,
  "Implementation Roadmap": Map,
  "Risks & Mitigations": AlertTriangle,
  "Success Metrics": Target,
  "Why Now": Clock,
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
  const [copied, setCopied] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const store = useCanvasStore()

  if (!elaboration) return null

  const toggleSection = (index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const addSectionAsNode = (section: { heading: string; content: string }) => {
    const id = `detail_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
    store.addNode({
      id,
      label: section.heading,
      parentId: elaboration.nodeId,
      nodeType: "detail",
      description: section.content.slice(0, 150) + "...",
    })
    store.runLayout()
  }

  const handleFollowUp = () => {
    if (!followUp.trim() || isLoading) return
    const currentMode = useCanvasStore.getState().currentMode
    const snapshot = useCanvasStore.getState().getGraphSnapshot()

    appendMessage(
      new TextMessage({
        content: `[Mode: ${currentMode}] Regarding "${elaboration.title}": ${followUp.trim()}. Use elaborate_node tool to add NEW sections to the document addressing this question. node_id="${elaboration.nodeId}", title="${elaboration.title}", summary="${elaboration.summary}". Generate 2-3 new sections with rich content.\n\nCurrent graph:\n${JSON.stringify(snapshot)}`,
        role: Role.User,
      })
    )
    setFollowUp("")
  }

  const handleCopy = () => {
    const text = `# ${elaboration.title}\n\n${elaboration.summary}\n\n${elaboration.sections.map(s => `## ${s.heading}\n\n${s.content}`).join("\n\n")}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyAsPrompt = () => {
    const prompt = `Here's a detailed analysis of "${elaboration.title}":\n\n${elaboration.summary}\n\n${elaboration.sections.map(s => `### ${s.heading}\n${s.content}`).join("\n\n")}\n\n---\nBased on this analysis, help me build this. What should I do first?`
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed top-0 right-0 bottom-0 w-[40vw] min-w-[480px] z-[55] bg-gray-950/98 backdrop-blur-xl border-l border-gray-700/80 shadow-2xl overflow-hidden animate-fade-in flex flex-col">
      {/* Header with gradient */}
      <div className="px-6 py-4 border-b border-gray-700/50 shrink-0 bg-gradient-to-r from-purple-900/30 via-blue-900/20 to-gray-900/0">
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
            <h2 className="text-xl font-bold text-white leading-tight pr-8">
              {elaboration.title}
            </h2>
          </div>
          <button
            onClick={clearElaboration}
            className="absolute top-4 right-5 text-gray-400 hover:text-white transition-colors text-lg leading-none p-1.5 rounded-lg hover:bg-gray-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 border-b border-gray-700/30 shrink-0">
        <p className="text-sm text-gray-300 leading-relaxed">{elaboration.summary}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-600 transition-colors"
          >
            <ClipboardCopy size={12} />
            {copied ? "Copied!" : "Copy as Markdown"}
          </button>
          <button
            onClick={handleCopyAsPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-600 transition-colors"
          >
            <Rocket size={12} />
            {copied ? "Copied!" : "Copy as Prompt"}
          </button>
        </div>
      </div>

      {/* Section count indicator */}
      <div className="px-6 py-2 border-b border-gray-700/20 shrink-0 flex items-center gap-2">
        <div className="flex gap-1">
          {elaboration.sections.map((_, i) => (
            <span key={i} className={`w-2 h-2 rounded-full ${DOT_COLORS[i % DOT_COLORS.length]}`} />
          ))}
        </div>
        <span className="text-[10px] text-gray-500">{elaboration.sections.length} sections</span>
        <span className="text-[10px] text-gray-600 ml-auto">Click to expand</span>
      </div>

      {/* Sections — collapsed by default */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {elaboration.sections.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-400">
              <span className="w-3 h-3 rounded-full bg-purple-500 animate-ping" />
              <span className="text-sm">Generating analysis...</span>
            </div>
          </div>
        )}

        {elaboration.sections.map((section, i) => {
          const SectionIcon = SECTION_ICONS[section.heading] || FileText
          const gradientColor = SECTION_COLORS[i % SECTION_COLORS.length]
          const dotColor = DOT_COLORS[i % DOT_COLORS.length]
          const isExpanded = expandedSections.has(i)

          return (
            <div key={i} className="rounded-xl border border-gray-700/40 overflow-hidden">
              {/* Section header — clickable to expand/collapse */}
              <button
                onClick={() => toggleSection(i)}
                className={`w-full px-4 py-3 bg-gradient-to-r ${gradientColor} border-b border-gray-700/30 flex items-center gap-2.5 text-left hover:brightness-110 transition-all`}
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="text-gray-400 shrink-0" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                )}
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />
                <SectionIcon size={14} className="text-gray-300 shrink-0" />
                <h3 className="text-sm font-bold text-white flex-1">
                  {section.heading}
                </h3>
                {/* Add as node button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addSectionAsNode(section)
                  }}
                  className="p-1 rounded-md hover:bg-gray-700/50 text-gray-500 hover:text-blue-400 transition-colors"
                  title="Add as node to canvas"
                >
                  <PlusCircle size={14} />
                </button>
              </button>
              {/* Section content — only shown when expanded */}
              {isExpanded && (
                <div className="px-4 py-4 bg-gray-900/30 animate-fade-in">
                  <div className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Elaborate Further button inside scroll area */}
        <button
          onClick={() => {
            const currentMode = useCanvasStore.getState().currentMode
            const snapshot = useCanvasStore.getState().getGraphSnapshot()
            appendMessage(
              new TextMessage({
                content: `[Mode: ${currentMode}] Elaborate FURTHER on "${elaboration.title}" (node_id="${elaboration.nodeId}"). The document already has ${elaboration.sections.length} sections. 

You MUST call elaborate_node tool with these parameters:
- node_id: "${elaboration.nodeId}"
- title: "${elaboration.title}"
- summary: "${elaboration.summary}"
- agent_name: "Deep Dive Specialist"
- sections: an array with these NEW sections (each with heading and content fields, content should be 3-4 paragraphs):

1. heading: "Technical Architecture", content: detailed system design with data flow, API contracts, database schema, and service boundaries
2. heading: "User Personas", content: 3 detailed personas with names, roles, goals, pain points, and how this solution helps them
3. heading: "Competitive Landscape", content: comparison with 3-4 real or analogous competitors, their strengths/weaknesses vs this idea
4. heading: "Go-to-Market Strategy", content: launch plan, distribution channels, how to get first 100 users, pricing strategy
5. heading: "Financial Model", content: cost structure, revenue streams, unit economics, break-even timeline

Call elaborate_node ONCE with all 5 sections. Make each section's content RICH and SPECIFIC.\n\nCurrent graph:\n${JSON.stringify(snapshot)}`,
                role: Role.User,
              })
            )
          }}
          disabled={isLoading}
          className="w-full mt-4 mb-2 px-4 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Generating more sections...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={14} />
              Elaborate Further — Add More Depth
            </span>
          )}
        </button>
      </div>

      {/* Pinned bottom: Ask the agent input with ACP agent selector */}
      <div className="px-6 py-3 border-t border-gray-700/50 shrink-0 bg-gray-900/80 backdrop-blur-sm">
        {/* ACP Agent selector */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] text-gray-500 mr-1">Talk to:</span>
          {[
            { name: "Claude", img: "/claude.png" },
            { name: "Kiro", img: "/kiro.png" },
            { name: "Gemini", img: "/gemini.png" },
          ].map((agent) => (
            <button
              key={agent.name}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 transition-colors"
              title={`Route to ${agent.name} via ACP`}
            >
              <img src={agent.img} alt={agent.name} className="w-3.5 h-3.5 rounded-sm" />
              <span className="text-[10px] text-gray-300 font-medium">{agent.name}</span>
            </button>
          ))}
          <span className="text-[9px] text-gray-600 ml-auto">via ACP</span>
        </div>
        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={followUp}
            onChange={(e) => setFollowUp(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleFollowUp() }}
            placeholder="Go deeper... ask about risks, tech stack, timeline..."
            className="flex-1 text-sm bg-gray-800/80 border border-gray-600 rounded-lg px-3 py-2 text-gray-200 placeholder-gray-500 outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={handleFollowUp}
            disabled={isLoading || !followUp.trim()}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-40 transition-colors"
          >
            Ask
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-2.5 border-t border-gray-700/50 shrink-0 bg-gray-900/50 flex items-center justify-between">
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
