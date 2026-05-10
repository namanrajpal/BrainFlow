# React Flow — Layouting with Dagre

React Flow doesn't include built-in layouting. Dagre is recommended as the simplest solution for tree/graph layouts.

## Layout Libraries Comparison

| Library | Best For | Notes |
|---------|----------|-------|
| **Dagre** | Tree layouts | Simple, fast, minimal configuration |
| **D3-Hierarchy** | Single-root trees | Limited to tree structures |
| **D3-Force** | Physics-based layouts | Iterative, requires continuous updates |
| **ELK/Elkjs** | Complex graphs | Most powerful but complex |

## Dagre + React Flow Integration

```typescript
import dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const NODE_WIDTH = 250;
const NODE_HEIGHT = 80;

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 100,
    marginx: 20,
    marginy: 20,
  });

  // Add nodes to dagre
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Add edges to dagre
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run layout
  dagre.layout(dagreGraph);

  // Apply calculated positions back to React Flow nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
```

## Usage in Component

```tsx
import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

function LayoutButton() {
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();

  const onLayout = useCallback((direction: 'TB' | 'LR') => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      getNodes(),
      getEdges(),
      direction
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);

    // Fit view after layout with animation
    window.requestAnimationFrame(() => {
      fitView({ duration: 300, padding: 0.2 });
    });
  }, [getNodes, getEdges, setNodes, setEdges, fitView]);

  return <button onClick={() => onLayout('TB')}>Auto Layout</button>;
}
```

## Auto-Layout on Node Addition

```typescript
function useAutoLayout() {
  const { getNodes, getEdges, setNodes, setEdges, fitView } = useReactFlow();

  const layoutAndFit = useCallback(() => {
    const { nodes: layoutedNodes, edges } = getLayoutedElements(
      getNodes(),
      getEdges(),
      'TB'
    );
    setNodes([...layoutedNodes]);
    setEdges([...edges]);
    
    requestAnimationFrame(() => {
      fitView({ duration: 500, padding: 0.1 });
    });
  }, [getNodes, getEdges, setNodes, setEdges, fitView]);

  return { layoutAndFit };
}
```

## Dagre Configuration Options

| Parameter | Default | Purpose |
|-----------|---------|---------|
| `rankdir` | `'TB'` | Direction: TB, BT, LR, RL |
| `nodesep` | `50` | Horizontal spacing between nodes (px) |
| `ranksep` | `50` | Vertical spacing between ranks (px) |
| `marginx` | `0` | Left/right margin |
| `marginy` | `0` | Top/bottom margin |
| `edgesep` | `10` | Horizontal edge separation |
| `ranker` | `'network-simplex'` | Ranking algorithm |

## Animated Layout Transitions

For smooth transitions when layout changes, use CSS transitions on nodes:

```css
.react-flow__node {
  transition: transform 0.3s ease-in-out;
}
```

Or use React Flow's built-in animation by updating positions gradually:

```typescript
// Animate to new positions over time
function animateLayout(currentNodes: Node[], targetNodes: Node[], duration = 300) {
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    
    const interpolated = currentNodes.map((node, i) => ({
      ...node,
      position: {
        x: node.position.x + (targetNodes[i].position.x - node.position.x) * eased,
        y: node.position.y + (targetNodes[i].position.y - node.position.y) * eased,
      },
    }));
    
    setNodes(interpolated);
    
    if (progress < 1) requestAnimationFrame(animate);
  }
  
  requestAnimationFrame(animate);
}
```
