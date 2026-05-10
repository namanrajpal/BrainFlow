# React Flow — Custom Nodes

## Creating a Custom Node Component

A custom node is a React component that receives props from React Flow:

```tsx
import { Handle, Position } from '@xyflow/react';

interface MindMapNodeData {
  label: string;
  description?: string;
  nodeType: 'idea' | 'detail' | 'question' | 'challenge' | 'action';
  color?: string;
}

function MindMapNode({ data, selected }: { data: MindMapNodeData; selected: boolean }) {
  return (
    <div className={`mind-map-node ${data.nodeType} ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="node-header">
        <span className="node-type-badge">{data.nodeType}</span>
        <h3>{data.label}</h3>
      </div>
      
      {data.description && (
        <p className="node-description">{data.description}</p>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default MindMapNode;
```

## Registering Custom Node Types

Define nodeTypes OUTSIDE the component (prevents re-renders):

```tsx
import MindMapNode from './MindMapNode';

// IMPORTANT: Define outside component to avoid re-creation on every render
const nodeTypes = {
  mindMapNode: MindMapNode,
};

function App() {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      // ...other props
    />
  );
}
```

## Using Custom Type in Node Data

```typescript
const nodes = [
  {
    id: 'node-1',
    type: 'mindMapNode',  // matches key in nodeTypes
    position: { x: 0, y: 0 },
    data: {
      label: 'Smart Invoicing',
      description: 'Auto-detect billable hours from calendar',
      nodeType: 'idea',
      color: '#3b82f6'
    },
  },
];
```

## Handle Component

Handles define connection points:

```tsx
import { Handle, Position } from '@xyflow/react';

// Single target (top) and source (bottom)
<Handle type="target" position={Position.Top} />
<Handle type="source" position={Position.Bottom} />

// Multiple handles with IDs
<Handle type="source" position={Position.Bottom} id="a" />
<Handle type="source" position={Position.Right} id="b" />
```

## Preventing Drag on Interactive Elements

Use the `nodrag` class on interactive elements inside nodes:

```tsx
<input className="nodrag" onChange={handleChange} />
<button className="nodrag" onClick={handleClick}>Expand</button>
```

## Custom Node Props (TypeScript)

```typescript
import { NodeProps } from '@xyflow/react';

type MindMapNodeProps = NodeProps<{
  label: string;
  description?: string;
  nodeType: string;
  color?: string;
}>;

function MindMapNode({ id, data, selected, dragging }: MindMapNodeProps) {
  // id: node ID
  // data: the data object from node definition
  // selected: boolean selection state
  // dragging: boolean drag state
}
```

## Dynamic Node Updates

Use `useReactFlow` to update nodes programmatically:

```typescript
import { useReactFlow } from '@xyflow/react';

function MyComponent() {
  const { setNodes, addNodes, updateNodeData } = useReactFlow();

  // Add a new node
  const addNode = () => {
    addNodes({
      id: 'new-1',
      type: 'mindMapNode',
      position: { x: 100, y: 200 },
      data: { label: 'New Idea', nodeType: 'idea' }
    });
  };

  // Update existing node data (merges by default)
  const updateNode = () => {
    updateNodeData('node-1', { color: 'green' });
  };
}
```
