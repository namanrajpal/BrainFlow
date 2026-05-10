import { useToastStore } from "../store/toastStore"

function ErrorToast() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2 px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm animate-[slideIn_0.3s_ease-out] ${
            toast.type === "error"
              ? "bg-red-950/95 border-red-800 text-red-200"
              : "bg-blue-950/95 border-blue-800 text-blue-200"
          }`}
        >
          <span className="text-sm flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className={`text-sm font-medium hover:opacity-70 transition-opacity ${
              toast.type === "error" ? "text-red-400" : "text-blue-400"
            }`}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

export default ErrorToast
