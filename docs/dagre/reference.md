# Dagre — Graph Layout Library Reference

Dagre is a JavaScript library for laying out directed graphs on the client-side. It focuses on layout computation, not rendering.

## Installation

```bash
npm install @dagrejs/dagre
```

## Basic Usage

```javascript
const dagre = require("@dagrejs/dagre");

// Create a new graph
const g = new dagre.graphlib.Graph();

// Set graph configuration
g.setGraph({
  rankdir: 'TB',  // Top to Bottom
  nodesep: 50,    // Horizontal node spacing
  ranksep: 100,   // Vertical rank spacing
});

// Set default edge label (required)
g.setDefaultEdgeLabel(() => ({}));

// Add nodes (must include width and height)
g.setNode("node1", { label: "Invoice Automation", width: 200, height: 60 });
g.setNode("node2", { label: "Auto-detect hours", width: 200, height: 60 });
g.setNode("node3", { label: "Payment reminders", width: 200, height: 60 });

// Add edges
g.setEdge("node1", "node2");
g.setEdge("node1", "node3");

// Run the layout algorithm
dagre.layout(g);

// Extract positions (x, y are CENTER coordinates)
g.nodes().forEach((v) => {
  const node = g.node(v);
  console.log(`Node ${v}: x=${node.x}, y=${node.y}`);
});

// Edge control points
g.edges().forEach((e) => {
  const edge = g.edge(e);
  console.log(`Edge ${e.v} -> ${e.w}: points=${JSON.stringify(edge.points)}`);
});
```

## Graph Configuration

```javascript
g.setGraph({
  rankdir: 'TB',      // TB (top-bottom), BT, LR (left-right), RL
  nodesep: 50,        // Horizontal separation between nodes (px)
  ranksep: 50,        // Vertical separation between ranks (px)
  marginx: 0,         // Left/right margin
  marginy: 0,         // Top/bottom margin
  edgesep: 10,        // Horizontal edge separation
  acyclicer: undefined, // Set to "greedy" for feedback arc heuristic
  ranker: 'network-simplex', // Ranking algorithm
});
```

## Node Options

```javascript
g.setNode("id", {
  width: 200,   // Required: node width
  height: 60,   // Required: node height
  label: "text" // Optional: label for rendering
});
```

## Edge Options

```javascript
g.setEdge("source", "target", {
  minlen: 1,      // Minimum edge length (in ranks)
  weight: 1,      // Edge weight (higher = shorter)
  width: 0,       // Edge label width
  height: 0,      // Edge label height
  labelpos: 'c',  // Label position: 'l', 'c', 'r'
  labeloffset: 10 // Label offset from edge
});
```

## Output After Layout

After calling `dagre.layout(g)`:

**Graph**: `g.graph()` returns `{ width, height }` — total layout dimensions

**Nodes**: `g.node(id)` returns `{ x, y, width, height }` — center coordinates

**Edges**: `g.edge({v, w})` returns `{ x, y, points }` — label position + control points array

## Important Notes

- x, y coordinates are CENTER of the node (subtract width/2 and height/2 for top-left)
- The graph must be reset before re-layout if structure changes
- Dagre handles DAGs (Directed Acyclic Graphs) best; cycles are broken with heuristic
- For rendering, use with React Flow, D3, or any visualization library
