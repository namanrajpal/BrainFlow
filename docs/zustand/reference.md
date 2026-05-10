# Zustand — State Management Reference

Zustand is a small, fast, scalable state-management solution using simplified flux principles. No boilerplate, no providers needed.

## Installation

```bash
npm install zustand
```

## Creating a Store

```typescript
import { create } from 'zustand'

interface CanvasState {
  nodes: Node[];
  edges: Edge[];
  addNode: (node: Node) => void;
  addEdge: (edge: Edge) => void;
  updateNode: (id: string, data: Partial<Node>) => void;
  reset: () => void;
}

const useCanvasStore = create<CanvasState>()((set, get) => ({
  nodes: [],
  edges: [],
  
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),
  
  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge]
  })),
  
  updateNode: (id, data) => set((state) => ({
    nodes: state.nodes.map(n => n.id === id ? { ...n, ...data } : n)
  })),
  
  reset: () => set({ nodes: [], edges: [] }),
}))
```

## Using in React Components

Select specific slices — components only re-render when selected values change:

```tsx
function NodeCounter() {
  const nodeCount = useCanvasStore((state) => state.nodes.length)
  return <span>{nodeCount} nodes</span>
}

function AddButton() {
  const addNode = useCanvasStore((state) => state.addNode)
  return <button onClick={() => addNode(newNode)}>Add</button>
}
```

## Selecting Multiple Values

Use `useShallow` to prevent re-renders when object reference changes but values are same:

```typescript
import { useShallow } from 'zustand/react/shallow'

const { nodes, edges } = useCanvasStore(
  useShallow((state) => ({ nodes: state.nodes, edges: state.edges }))
)
```

## Async Actions

```typescript
const useStore = create<State>()((set) => ({
  data: null,
  loading: false,
  
  fetchData: async (url: string) => {
    set({ loading: true })
    const response = await fetch(url)
    const data = await response.json()
    set({ data, loading: false })
  },
}))
```

## Reading State in Actions (get)

```typescript
const useStore = create((set, get) => ({
  nodes: [],
  
  getNodeById: (id: string) => {
    return get().nodes.find(n => n.id === id)
  },
  
  addChildNode: (parentId: string, child: Node) => {
    const parent = get().nodes.find(n => n.id === parentId)
    if (parent) {
      set((state) => ({ nodes: [...state.nodes, child] }))
    }
  },
}))
```

## Non-Reactive Access & Subscriptions

```typescript
// Get state outside React
const currentNodes = useCanvasStore.getState().nodes

// Set state outside React
useCanvasStore.setState({ nodes: newNodes })

// Subscribe to changes
const unsub = useCanvasStore.subscribe(console.log)
unsub() // cleanup
```

## Immer Middleware (Nested Updates)

```typescript
import { immer } from 'zustand/middleware/immer'

const useStore = create<State>()(
  immer((set) => ({
    nodes: [],
    
    updateNodeColor: (id: string, color: string) =>
      set((state) => {
        const node = state.nodes.find(n => n.id === id)
        if (node) node.data.color = color  // direct mutation OK with immer
      }),
  }))
)
```

## DevTools Middleware

```typescript
import { devtools } from 'zustand/middleware'

const useStore = create<State>()(
  devtools((set) => ({
    // ... store definition
  }), { name: 'CanvasStore' })
)
```

## TypeScript Pattern

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface BrainFlowState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  isStreaming: boolean;
  agentMode: 'brainstorm' | 'architect' | 'critic' | 'researcher';
  
  // Actions
  addNode: (node: MindMapNode) => void;
  addEdge: (edge: MindMapEdge) => void;
  setStreaming: (streaming: boolean) => void;
  setMode: (mode: BrainFlowState['agentMode']) => void;
}

const useBrainFlowStore = create<BrainFlowState>()(
  devtools(
    immer((set) => ({
      nodes: [],
      edges: [],
      isStreaming: false,
      agentMode: 'brainstorm',
      
      addNode: (node) => set((state) => { state.nodes.push(node) }),
      addEdge: (edge) => set((state) => { state.edges.push(edge) }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      setMode: (mode) => set({ agentMode: mode }),
    })),
    { name: 'BrainFlow' }
  )
)
```

## Key Advantages

- No providers needed (unlike Context)
- Only re-renders affected components
- Works outside React (vanilla)
- Tiny bundle size (~1KB)
- Middleware composition (immer, devtools, persist)
