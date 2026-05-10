import { useState, type FormEvent } from "react"
import { useCopilotChat } from "@copilotkit/react-core"
import { TextMessage, Role } from "@copilotkit/runtime-client-gql"
import { useCanvasStore } from "../store/canvasStore"

function PromptInput() {
  const [input, setInput] = useState("")
  const { appendMessage, isLoading } = useCopilotChat()
  const nodes = useCanvasStore((s) => s.nodes)
  const hasNodes = nodes.length > 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    // Get the current graph snapshot to include as context
    const snapshot = useCanvasStore.getState().getGraphSnapshot()
    const currentMode = useCanvasStore.getState().currentMode
    const contextSuffix =
      snapshot.nodes.length > 0
        ? `\n\nCurrent graph:\n${JSON.stringify(snapshot)}`
        : ""

    // Prepend mode so the backend can route to the correct agent graph
    const messageContent = `[Mode: ${currentMode}] ${trimmed}${contextSuffix}`

    // Clear input immediately for responsiveness
    setInput("")

    // Send the message to the agent
    await appendMessage(
      new TextMessage({
        content: messageContent,
        role: Role.User,
      })
    )
  }

  // Big centered input when canvas is empty, compact bottom bar when nodes exist
  if (!hasNodes) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto w-full max-w-2xl px-4"
        >
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">BrainFlow</h1>
            <p className="text-gray-400 text-sm">AI brainstorming partner on an infinite canvas</p>
          </div>
          <div className="flex items-center gap-3 bg-gray-900/95 backdrop-blur-md border border-gray-600 rounded-2xl shadow-2xl px-5 py-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "Generating ideas..." : "What do you want to brainstorm?"}
              disabled={isLoading}
              autoFocus
              className="flex-1 bg-transparent outline-none text-lg text-gray-100 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-5 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "..." : "Go"}
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-600 mt-3">
            Try: "Hackathon ideas for AI Tinkerers using AG-UI" or "Ways to make coding more fun"
          </p>
        </form>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg px-4 py-2 w-full max-w-xl z-50"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={isLoading ? "Agent is thinking..." : "Ask anything about the canvas..."}
        disabled={isLoading}
        className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "..." : "Send"}
      </button>
    </form>
  )
}

export default PromptInput
