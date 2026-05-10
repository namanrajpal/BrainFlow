import { CopilotKit, useCopilotChat } from "@copilotkit/react-core"
import BrainFlowCanvas from "./components/BrainFlowCanvas"
import PromptInput from "./components/PromptInput"
import AgentStatus from "./components/AgentStatus"
import ModeSelector from "./components/ModeSelector"
import ErrorToast from "./components/ErrorToast"
import DetailPanel from "./components/DetailPanel"
import ElaborationPanel from "./components/ElaborationPanel"
import { useCanvasStore } from "./store/canvasStore"
import { useElaborationStore } from "./store/elaborationStore"

function AppContent() {
  const { isLoading } = useCopilotChat()
  const nodes = useCanvasStore((s) => s.nodes)
  const activeElaboration = useElaborationStore((s) => s.activeElaboration)

  return (
    <div className="w-screen h-screen relative bg-gray-950">
      {/* Screen glow effect when agent is working */}
      {isLoading && (
        <>
          {/* Animated gradient border glow */}
          <div className="fixed inset-0 z-[1] pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-[shimmer_1.5s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 animate-[shimmer_1.5s_ease-in-out_infinite_reverse]" />
            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 animate-[shimmer_1.5s_ease-in-out_infinite]" />
            <div className="absolute top-0 right-0 bottom-0 w-1.5 bg-gradient-to-b from-pink-500 via-purple-500 to-blue-500 animate-[shimmer_1.5s_ease-in-out_infinite_reverse]" />
          </div>
          {/* Corner glow orbs */}
          <div className="fixed top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl z-[1] pointer-events-none animate-pulse" />
          <div className="fixed bottom-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl z-[1] pointer-events-none animate-pulse" />
        </>
      )}

      <BrainFlowCanvas />

      <PromptInput />
      <AgentStatus />
      {nodes.length > 0 && <ModeSelector />}
      {nodes.length > 0 && (
        <button className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors">
          <span className="w-4 h-4 flex items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">+</span>
          Add New Topic
        </button>
      )}
      <ErrorToast />
      <DetailPanel />
      {activeElaboration && <ElaborationPanel />}
    </div>
  )
}

function App() {
  const threadId = useCanvasStore((s) => s.threadId)

  return (
    <CopilotKit runtimeUrl="/agent" threadId={threadId}>
      <AppContent />
    </CopilotKit>
  )
}

export default App
