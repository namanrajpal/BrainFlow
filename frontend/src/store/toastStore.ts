import { create } from "zustand"

export interface Toast {
  id: string
  message: string
  type: "error" | "info"
}

interface ToastStore {
  toasts: Toast[]
  addToast: (message: string, type?: "error" | "info") => void
  removeToast: (id: string) => void
}

export const useToastStore = create<ToastStore>()((set) => ({
  toasts: [],

  addToast: (message: string, type: "error" | "info" = "error") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 5000)
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },
}))
