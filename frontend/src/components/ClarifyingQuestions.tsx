import { MessageSquare, Rocket, Wrench, Users, Building2, Sparkles, Code, Globe, Cpu, Palette } from "lucide-react"

interface ClarifyingQuestionsProps {
  question: string
  options: string[]
  onAnswer: (answer: string) => void
  status: string
}

// Map keywords in options to relevant icons
function getOptionIcon(option: string) {
  const lower = option.toLowerCase()
  if (lower.includes("demo") || lower.includes("prototype") || lower.includes("fast")) return Rocket
  if (lower.includes("tool") || lower.includes("developer") || lower.includes("infra")) return Wrench
  if (lower.includes("end-user") || lower.includes("consumer") || lower.includes("user")) return Users
  if (lower.includes("enterprise") || lower.includes("workflow") || lower.includes("business")) return Building2
  if (lower.includes("experiment") || lower.includes("wild") || lower.includes("creative")) return Sparkles
  if (lower.includes("code") || lower.includes("programming") || lower.includes("api")) return Code
  if (lower.includes("web") || lower.includes("platform") || lower.includes("saas")) return Globe
  if (lower.includes("ai") || lower.includes("ml") || lower.includes("model")) return Cpu
  if (lower.includes("design") || lower.includes("ui") || lower.includes("ux")) return Palette
  return Sparkles
}

// Map keywords to accent colors
function getOptionColor(option: string) {
  const lower = option.toLowerCase()
  if (lower.includes("demo") || lower.includes("prototype") || lower.includes("fast")) return "border-blue-500/50 hover:border-blue-400 hover:bg-blue-900/20"
  if (lower.includes("tool") || lower.includes("developer") || lower.includes("infra")) return "border-green-500/50 hover:border-green-400 hover:bg-green-900/20"
  if (lower.includes("end-user") || lower.includes("consumer") || lower.includes("user")) return "border-purple-500/50 hover:border-purple-400 hover:bg-purple-900/20"
  if (lower.includes("enterprise") || lower.includes("workflow") || lower.includes("business")) return "border-amber-500/50 hover:border-amber-400 hover:bg-amber-900/20"
  if (lower.includes("experiment") || lower.includes("wild") || lower.includes("creative")) return "border-pink-500/50 hover:border-pink-400 hover:bg-pink-900/20"
  return "border-gray-600 hover:border-gray-400 hover:bg-gray-800/50"
}

function getIconColor(option: string) {
  const lower = option.toLowerCase()
  if (lower.includes("demo") || lower.includes("prototype") || lower.includes("fast")) return "text-blue-400"
  if (lower.includes("tool") || lower.includes("developer") || lower.includes("infra")) return "text-green-400"
  if (lower.includes("end-user") || lower.includes("consumer") || lower.includes("user")) return "text-purple-400"
  if (lower.includes("enterprise") || lower.includes("workflow") || lower.includes("business")) return "text-amber-400"
  if (lower.includes("experiment") || lower.includes("wild") || lower.includes("creative")) return "text-pink-400"
  return "text-gray-400"
}

function ClarifyingQuestions({ question, options, onAnswer, status }: ClarifyingQuestionsProps) {
  if (status === "complete") {
    return <></>
  }

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-full max-w-lg animate-fade-in">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10" />

      <div className="bg-gray-900/98 backdrop-blur-xl border border-gray-600 rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          <MessageSquare size={14} className="text-purple-400" />
          <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
            Agent needs your input
          </span>
        </div>

        {/* Question */}
        <h2 className="text-lg font-semibold text-white leading-snug mb-5">
          {question}
        </h2>

        {/* Options with icons and colors */}
        <div className="flex flex-col gap-2.5">
          {options.map((option, i) => {
            const Icon = getOptionIcon(option)
            const colorClass = getOptionColor(option)
            const iconColor = getIconColor(option)

            return (
              <button
                key={i}
                onClick={() => onAnswer(option)}
                className={`w-full text-left px-4 py-3.5 bg-gray-800/60 border rounded-xl text-sm text-gray-200 transition-all hover:shadow-lg flex items-center gap-3 ${colorClass}`}
              >
                <div className={`w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center shrink-0 ${iconColor}`}>
                  <Icon size={16} />
                </div>
                <span className="font-medium">{option}</span>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <p className="text-[11px] text-gray-500 mt-4 text-center">
          Click an option or type your own answer in the prompt bar
        </p>
      </div>
    </div>
  )
}

export default ClarifyingQuestions
