import { useCopilotChat } from "@copilotkit/react-core"
import { useCanvasStore } from "../store/canvasStore"

function AgentStatus() {
  const { isLoading, visibleMessages } = useCopilotChat()
  const nodes = useCanvasStore((s) => s.nodes)
  const edges = useCanvasStore((s) => s.edges)

  // Get the last assistant message for reasoning display
  const lastAgentMessage = (visibleMessages ?? [])
    .filter((msg) => msg.isTextMessage() && msg.role === "assistant")
    .pop()

  const lastMessageContent = lastAgentMessage && lastAgentMessage.isTextMessage()
    ? lastAgentMessage.content
    : null

  return (
    <div className="fixed bottom-20 left-4 z-50 flex flex-col gap-2 max-w-xs">
      {/* Live stats */}
      {nodes.length > 0 && (
        <div className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg px-3 py-1.5">
          <span className="text-[11px] text-gray-400">
            <span className="text-blue-400 font-medium">{nodes.length}</span> nodes
          </span>
          <span className="text-[11px] text-gray-400">
            <span className="text-purple-400 font-medium">{edges.length}</span> edges
          </span>
        </div>
      )}

      {/* Thinking indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-sm px-3 py-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
          </span>
          <span className="text-sm text-gray-300 font-medium">Thinking...</span>
        </div>
      )}

      {/* Agent reasoning stream */}
      {lastMessageContent && (
        <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg shadow-sm px-3 py-2 max-h-28 overflow-y-auto">
          <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Agent reasoning</p>
          <p className="text-xs text-gray-300 leading-relaxed">
            {lastMessageContent.length > 200 ? lastMessageContent.slice(-200) + "..." : lastMessageContent}
          </p>
        </div>
      )}
    </div>
  )
}

export default AgentStatus
