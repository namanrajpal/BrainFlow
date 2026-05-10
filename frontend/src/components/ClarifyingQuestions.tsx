/**
 * ClarifyingQuestions — Rendered by AG-UI when the agent calls ask_user.
 * This is a core AG-UI "Generative UI" feature: the agent's tool call
 * renders an interactive React component that the user interacts with.
 */

interface ClarifyingQuestionsProps {
  question: string
  options: string[]
  onAnswer: (answer: string) => void
  status: string
}

function ClarifyingQuestions({ question, options, onAnswer, status }: ClarifyingQuestionsProps) {
  if (status === "complete") {
    return <></>
  }

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[80] w-full max-w-md animate-fade-in">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm -z-10" />

      {/* Card */}
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-600 rounded-2xl shadow-2xl p-6">
        {/* AG-UI badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
          </span>
          <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wide">
            Agent is asking you
          </span>
        </div>

        {/* Question */}
        <h2 className="text-lg font-semibold text-white leading-snug mb-4">
          {question}
        </h2>

        {/* Options as clickable buttons */}
        <div className="flex flex-col gap-2">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => onAnswer(option)}
              className="w-full text-left px-4 py-3 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-600 hover:border-purple-500/50 rounded-xl text-sm text-gray-200 transition-all hover:shadow-lg hover:shadow-purple-500/10"
            >
              {option}
            </button>
          ))}
        </div>

        {/* Free text hint */}
        <p className="text-[11px] text-gray-500 mt-3 text-center">
          Click an option or type your own answer in the prompt bar below
        </p>
      </div>
    </div>
  )
}

export default ClarifyingQuestions
