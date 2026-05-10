# React Flow (@xyflow/react) — Getting Started

## Installation

```bash
npm install @xyflow/react
```

## Basic Setup

```tsx
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  Controls,
  MiniMap,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'n1-n2', source: 'n1', target: 'n2' }
];

export default function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
```

**Important**: If using Tailwind CSS 4, import React Flow CSS after the Tailwind stylesheet.

## Node Data Structure

```typescript
interface Node {
  id: string;
  position: { x: number; y: number };
  data: Record<string, any>;  // passed to node component
  type?: string;              // custom node type name
  style?: CSSProperties;
  className?: string;
  hidden?: boolean;
  selected?: boolean;
  draggable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
}
```

## Edge Data Structure

```typescript
interface Edge {
  id: string;
  source: string;       // source node id
  target: string;       // target node id
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;        // 'default' | 'straight' | 'step' | 'smoothstep' | custom
  animated?: boolean;
  label?: string | ReactNode;
  style?: CSSProperties;
  data?: Record<string, any>;
}
```

## Key Hooks

- `useReactFlow()` — programmatic access to nodes/edges/viewport
- `useNodes()` — reactive node array (causes re-render)
- `useEdges()` — reactive edge array (causes re-render)
- `useNodeId()` — get current node's ID (inside custom node)

## Key Utilities

- `applyNodeChanges(changes, nodes)` — apply node change events
- `applyEdgeChanges(changes, edges)` — apply edge change events
- `addEdge(params, edges)` — add new edge to array
- `getBezierPath()` — calculate bezier edge path

## Key Components

- `<Background />` — dots/lines/cross background
- `<Controls />` — zoom/fit controls
- `<MiniMap />` — overview minimap
- `<Handle />` — connection handle on custom nodes
- `<NodeToolbar />` — floating toolbar for nodes
