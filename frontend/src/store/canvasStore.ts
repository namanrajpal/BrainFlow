import { create } from "zustand"
import { runDagreLayout } from "../utils/layout"

// --- Types ---

export type AgentMode = "brainstorm" | "architect" | "critic" | "researcher"

export interface MindMapNodeData {
  [key: string]: unknown
  id: string
  label: string
  description?: string
  nodeType: "topic" | "theme" | "idea" | "detail" | "question" | "challenge" | "action"
  color?: string
  score?: number
  parentId?: string
}

export interface MindMapNode {
  id: string
  type: "mindMapNode"
  position: { x: number; y: number }
  data: MindMapNodeData
}

export interface MindMapEdge {
  id: string
  source: string
  target: string
  label?: string
  style?: "solid" | "dashed" | "dotted"
  animated?: boolean
}

export interface NodeInput {
  id: string
  label: string
  parentId?: string
  nodeType: string
  description?: string
  color?: string
}

export interface EdgeInput {
  source: string
  target: string
  label?: string
  style?: string
  animated?: boolean
}

export interface NodeUpdate {
  id: string
  score?: number
  color?: string
}

export interface GraphSnapshot {
  nodes: Array<{
    id: string
    label: string
    description?: string
    nodeType: string
    parentId?: string
  }>
  edges: Array<{ source: string; target: string; label?: string }>
}

// --- Store Interface ---

export interface CanvasStore {
  nodes: MindMapNode[]
  edges: MindMapEdge[]
  currentMode: AgentMode
  threadId: string
  selectedNodeId: string | null

  addNode: (input: NodeInput) => void
  addEdge: (input: EdgeInput) => void
  updateNodeBatch: (updates: NodeUpdate[]) => void
  switchMode: (mode: AgentMode) => void
  getGraphSnapshot: () => GraphSnapshot
  runLayout: () => void
  reset: () => void
}

// --- Store Implementation ---

export const useCanvasStore = create<CanvasStore>()((set, get) => ({
  nodes: [],
  edges: [],
  currentMode: "brainstorm",
  threadId: crypto.randomUUID(),
  selectedNodeId: null,

  addNode: (input: NodeInput) => {
    const state = get()

    // Idempotent: no-op if node with this ID already exists
    if (state.nodes.some((n) => n.id === input.id)) {
      return
    }

    const newNode: MindMapNode = {
      id: input.id,
      type: "mindMapNode",
      position: { x: 0, y: 0 },
      data: {
        id: input.id,
        label: input.label,
        description: input.description,
        nodeType: input.nodeType as MindMapNodeData["nodeType"],
        color: input.color,
        parentId: input.parentId,
      },
    }

    const newEdges = [...state.edges]

    // If parentId is provided and the parent node exists, add an edge
    if (
      input.parentId &&
      state.nodes.some((n) => n.id === input.parentId)
    ) {
      const edge: MindMapEdge = {
        id: `${input.parentId}-${input.id}`,
        source: input.parentId,
        target: input.id,
      }
      newEdges.push(edge)
    }

    set({
      nodes: [...state.nodes, newNode],
      edges: newEdges,
    })
  },

  addEdge: (input: EdgeInput) => {
    const state = get()

    // Validate both source and target nodes exist
    const sourceExists = state.nodes.some((n) => n.id === input.source)
    const targetExists = state.nodes.some((n) => n.id === input.target)

    if (!sourceExists || !targetExists) {
      return
    }

    const newEdge: MindMapEdge = {
      id: `${input.source}-${input.target}`,
      source: input.source,
      target: input.target,
      label: input.label,
      style: input.style as MindMapEdge["style"],
      animated: input.animated,
    }

    set({ edges: [...state.edges, newEdge] })
  },

  updateNodeBatch: (updates: NodeUpdate[]) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        const update = updates.find((u) => u.id === node.id)
        if (!update) return node
        return {
          ...node,
          data: {
            ...node.data,
            ...(update.score !== undefined && { score: update.score }),
            ...(update.color !== undefined && { color: update.color }),
          },
        }
      }),
    }))
  },

  switchMode: (mode: AgentMode) => {
    set({
      currentMode: mode,
      threadId: crypto.randomUUID(),
      // nodes and edges are preserved
    })
  },

  getGraphSnapshot: (): GraphSnapshot => {
    const state = get()
    return {
      nodes: state.nodes.map((n) => ({
        id: n.data.id,
        label: n.data.label,
        description: n.data.description,
        nodeType: n.data.nodeType,
        parentId: n.data.parentId,
      })),
      edges: state.edges.map((e) => ({
        source: e.source,
        target: e.target,
        label: e.label,
      })),
    }
  },

  runLayout: () => {
    const state = get()
    if (state.nodes.length === 0) return
    const layoutedNodes = runDagreLayout(state.nodes, state.edges)
    set({ nodes: layoutedNodes })
  },

  reset: () => {
    set({
      nodes: [],
      edges: [],
      currentMode: "brainstorm",
      threadId: crypto.randomUUID(),
      selectedNodeId: null,
    })
  },
}))
