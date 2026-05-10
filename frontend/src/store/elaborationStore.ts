import { create } from "zustand"

export interface ElaborationSection {
  heading: string
  content: string
  agentName?: string  // which "agent" generated this section
}

export interface Elaboration {
  nodeId: string
  title: string
  summary: string
  sections: ElaborationSection[]
  isGenerating?: boolean
}

interface ElaborationStore {
  activeElaboration: Elaboration | null
  setElaboration: (elaboration: Elaboration) => void
  appendSections: (nodeId: string, sections: ElaborationSection[]) => void
  setGenerating: (generating: boolean) => void
  clearElaboration: () => void
}

export const useElaborationStore = create<ElaborationStore>()((set, get) => ({
  activeElaboration: null,

  setElaboration: (elaboration) => set({ activeElaboration: { ...elaboration, isGenerating: true } }),

  appendSections: (nodeId, sections) => {
    const current = get().activeElaboration
    if (current && current.nodeId === nodeId) {
      set({
        activeElaboration: {
          ...current,
          sections: [...current.sections, ...sections],
        },
      })
    }
  },

  setGenerating: (generating) => {
    const current = get().activeElaboration
    if (current) {
      set({ activeElaboration: { ...current, isGenerating: generating } })
    }
  },

  clearElaboration: () => set({ activeElaboration: null }),
}))
