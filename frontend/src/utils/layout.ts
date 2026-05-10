import dagre from "dagre";
import type { MindMapNode, MindMapEdge } from "../store/canvasStore";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;

/**
 * Runs dagre layout on the given nodes and edges.
 * Returns a new array of nodes with updated positions (top-left corner).
 */
export function runDagreLayout(
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): MindMapNode[] {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "TB", nodesep: 80, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    };
  });
}
