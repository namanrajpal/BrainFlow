import { useCopilotChat } from "@copilotkit/react-core"
import { TextMessage, Role } from "@copilotkit/runtime-client-gql"
import { useCanvasStore } from "../store/canvasStore"

function ActionBar() {
  const { appendMessage, isLoading } = useCopilotChat()
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId)
  const nodes = useCanvasStore((s) => s.nodes)

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId)
    : null
  const selectedLabel = selectedNode?.data.label ?? ""

  const sendAction = async (prompt: string) => {
    const snapshot = useCanvasStore.getState().getGraphSnapshot()
    const currentMode = useCanvasStore.getState().currentMode
    const contextSuffix =
      snapshot.nodes.length > 0
        ? `\n\nCurrent graph:\n${JSON.stringify(snapshot)}`
        : ""

    // Prepend mode so the backend can route to the correct agent graph
    await appendMessage(
      new TextMessage({
        content: `[Mode: ${currentMode}] ${prompt}${contextSuffix}`,
        role: Role.User,
      })
    )
  }

  const handleExpand = () => {
    if (!selectedLabel) return
    sendAction(`Expand node '${selectedLabel}' with 3-5 child ideas`)
  }

  const handleChallenge = () => {
    if (!selectedLabel) return
    sendAction(
      `Challenge node '${selectedLabel}' — find risks and counter-arguments`
    )
  }

  const handleConnect = () => {
    sendAction("Find non-obvious connections between distant nodes")
  }

  const handlePrioritize = () => {
    sendAction(
      "Score each idea node 1-10 by feasibility. Use prioritize_nodes."
    )
  }

  const needsSelection = !selectedNodeId
  const disabled = isLoading

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg px-3 py-2">
      <button
        onClick={handleExpand}
        disabled={disabled || needsSelection}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Expand
      </button>
      <button
        onClick={handleChallenge}
        disabled={disabled || needsSelection}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Challenge
      </button>
      <button
        onClick={handleConnect}
        disabled={disabled}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-900/50 text-purple-300 hover:bg-purple-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Find Connections
      </button>
      <button
        onClick={handlePrioritize}
        disabled={disabled}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-green-900/50 text-green-300 hover:bg-green-800/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Prioritize
      </button>
    </div>
  )
}

export default ActionBar
