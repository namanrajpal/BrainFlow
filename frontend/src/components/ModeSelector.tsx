import { useCanvasStore } from "../store/canvasStore"
import type { AgentMode } from "../store/canvasStore"

const modes: { value: AgentMode; label: string; color: string; hint: string }[] = [
  { value: "brainstorm", label: "Brainstorm", color: "bg-blue-500", hint: "Creative & divergent ideas" },
  { value: "architect", label: "Architect", color: "bg-green-500", hint: "Technical breakdown & APIs" },
  { value: "critic", label: "Critic", color: "bg-red-500", hint: "Devil's advocate for ALL nodes" },
  { value: "researcher", label: "Researcher", color: "bg-purple-500", hint: "Evidence & real examples" },
]

function ModeSelector() {
  const currentMode = useCanvasStore((s) => s.currentMode)
  const switchMode = useCanvasStore((s) => s.switchMode)

  const currentModeConfig = modes.find((m) => m.value === currentMode)!

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as AgentMode
    if (newMode !== currentMode) {
      switchMode(newMode)
    }
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl shadow-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${currentModeConfig.color}`}
          aria-hidden="true"
        />
        <select
          value={currentMode}
          onChange={handleChange}
          className="text-sm font-medium bg-transparent border-none outline-none cursor-pointer text-gray-200 pr-6 appearance-none"
          aria-label="Select agent mode"
        >
          {modes.map((mode) => (
            <option key={mode.value} value={mode.value} className="bg-gray-900 text-gray-200">
              {mode.label}
            </option>
          ))}
        </select>
        <svg
          className="w-3.5 h-3.5 text-gray-400 -ml-5 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
      <p className="text-[10px] text-gray-500 mt-1">{currentModeConfig.hint}</p>
    </div>
  )
}

export default ModeSelector
