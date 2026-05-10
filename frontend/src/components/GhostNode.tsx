/**
 * GhostNode — A placeholder "thinking" node shown while the agent
 * is generating a new node via the add_node tool.
 * 
 * This is the "Generative UI" feature of AG-UI:
 * The agent calls a tool → before it completes, we render a preview.
 */

interface GhostNodeProps {
  label?: string
  nodeType?: string
}

function GhostNode({ label, nodeType }: GhostNodeProps) {
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div className="flex items-center gap-3 bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-xl px-4 py-3 shadow-xl animate-pulse">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </div>
        <div>
          <p className="text-sm text-gray-200 font-medium">
            {label ? `Adding: ${label}` : "Generating node..."}
          </p>
          {nodeType && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Type: {nodeType}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default GhostNode
