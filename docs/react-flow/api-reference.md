# React Flow — API Reference

## ReactFlow Component Props

### Core Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `Node[]` | `[]` | Nodes to render |
| `edges` | `Edge[]` | `[]` | Edges to render |
| `nodeTypes` | `Record<string, ComponentType>` | | Custom node components |
| `edgeTypes` | `Record<string, ComponentType>` | | Custom edge components |
| `fitView` | `boolean` | `false` | Auto-fit all nodes on load |

### Viewport Props
| Prop | Type | Default |
|------|------|---------|
| `defaultViewport` | `{ x, y, zoom }` | `{ x: 0, y: 0, zoom: 1 }` |
| `minZoom` | `number` | `0.5` |
| `maxZoom` | `number` | `2` |
| `snapToGrid` | `boolean` | `false` |
| `snapGrid` | `[number, number]` | `[15, 15]` |

### Event Handlers
```typescript
// Node events
onNodeClick?: (event: MouseEvent, node: Node) => void
onNodeDoubleClick?: (event: MouseEvent, node: Node) => void
onNodeDragStart?: (event: MouseEvent, node: Node) => void
onNodeDrag?: (event: MouseEvent, node: Node) => void
onNodeDragStop?: (event: MouseEvent, node: Node) => void
onNodeMouseEnter?: (event: MouseEvent, node: Node) => void
onNodeMouseLeave?: (event: MouseEvent, node: Node) => void
onNodeContextMenu?: (event: MouseEvent, node: Node) => void

// Edge events
onEdgeClick?: (event: MouseEvent, edge: Edge) => void
onEdgesChange?: (changes: EdgeChange[]) => void

// Connection events
onConnect?: (connection: Connection) => void
onConnectStart?: (event: MouseEvent, params: OnConnectStartParams) => void
onConnectEnd?: (event: MouseEvent) => void

// Change handlers
onNodesChange?: (changes: NodeChange[]) => void
onEdgesChange?: (changes: EdgeChange[]) => void
onSelectionChange?: (params: { nodes: Node[]; edges: Edge[] }) => void

// Pane events
onPaneClick?: (event: MouseEvent) => void
onPaneContextMenu?: (event: MouseEvent) => void
onMove?: (event: MouseEvent, viewport: Viewport) => void

// Lifecycle
onInit?: (instance: ReactFlowInstance) => void
onDelete?: (params: { nodes: Node[]; edges: Edge[] }) => void
```

### Interaction Props
| Prop | Type | Default |
|------|------|---------|
| `nodesDraggable` | `boolean` | `true` |
| `nodesConnectable` | `boolean` | `true` |
| `panOnDrag` | `boolean` | `true` |
| `zoomOnScroll` | `boolean` | `true` |
| `zoomOnPinch` | `boolean` | `true` |
| `panOnScroll` | `boolean` | `false` |
| `connectOnClick` | `boolean` | `true` |
| `colorMode` | `'light' \| 'dark'` | `'light'` |

---

## useReactFlow() Hook

Returns a `ReactFlowInstance` for programmatic control. Does NOT cause re-renders.

### Node/Edge Methods
```typescript
const {
  getNodes,        // () => Node[]
  setNodes,        // (nodes: Node[] | (nodes: Node[]) => Node[]) => void
  addNodes,        // (nodes: Node | Node[]) => void
  getNode,         // (id: string) => Node | undefined
  updateNode,      // (id: string, nodeUpdate: Partial<Node>) => void
  updateNodeData,  // (id: string, data: object, options?: { replace?: boolean }) => void
  deleteElements,  // (params: { nodes?: Node[]; edges?: Edge[] }) => Promise<{...}>
  getEdges,        // () => Edge[]
  setEdges,        // (edges: Edge[] | (edges: Edge[]) => Edge[]) => void
  addEdges,        // (edges: Edge | Edge[]) => void
  getEdge,         // (id: string) => Edge | undefined
  updateEdge,      // (id: string, edgeUpdate: Partial<Edge>) => void
  updateEdgeData,  // (id: string, data: object) => void
} = useReactFlow();
```

### Viewport Methods
```typescript
const {
  zoomIn,              // (options?) => Promise<boolean>
  zoomOut,             // (options?) => Promise<boolean>
  zoomTo,              // (level, options?) => Promise<boolean>
  getZoom,             // () => number
  setViewport,         // (viewport: Viewport, options?) => Promise<boolean>
  getViewport,         // () => Viewport
  setCenter,           // (x, y, options?) => Promise<boolean>
  fitView,             // (options?) => Promise<boolean>
  fitBounds,           // (bounds: Rect, options?) => Promise<boolean>
  screenToFlowPosition, // (position: XYPosition) => XYPosition
  flowToScreenPosition, // (position: XYPosition) => XYPosition
  viewportInitialized,  // boolean
} = useReactFlow();
```

### Utility Methods
```typescript
const {
  getIntersectingNodes,  // (node: Node | Rect) => Node[]
  isNodeIntersecting,    // (node: Node | Rect, area: Rect) => boolean
  getHandleConnections,  // (params) => HandleConnection[]
  getNodeConnections,    // (params) => NodeConnection[]
  getNodesBounds,        // (nodeIds: string[]) => Rect
  toObject,              // () => ReactFlowJsonObject (nodes, edges, viewport)
} = useReactFlow();
```

---

## Programmatic Node Addition Example

```typescript
import { useReactFlow } from '@xyflow/react';

function useCanvasActions() {
  const { addNodes, addEdges, fitView } = useReactFlow();

  const addMindMapNode = (nodeData: {
    id: string;
    label: string;
    parentId: string;
    nodeType: string;
  }) => {
    addNodes({
      id: nodeData.id,
      type: 'mindMapNode',
      position: { x: 0, y: 0 }, // will be recalculated by dagre
      data: {
        label: nodeData.label,
        nodeType: nodeData.nodeType,
      },
    });

    addEdges({
      id: `${nodeData.parentId}-${nodeData.id}`,
      source: nodeData.parentId,
      target: nodeData.id,
      animated: true,
    });

    // Re-fit after adding
    setTimeout(() => fitView({ duration: 300 }), 100);
  };

  return { addMindMapNode };
}
```
