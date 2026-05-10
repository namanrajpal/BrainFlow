import { useCallback, useMemo, useState, useEffect, useRef } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
  type NodeChange,
  type EdgeChange,
  type Node,
  type Edge,
  type NodeMouseHandler,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { useCopilotAction, useCopilotReadable, useCopilotChat } from "@copilotkit/react-core"

import MindMapNode from "./MindMapNode"
import GhostNode from "./GhostNode"
import NodeContextMenu from "./NodeContextMenu"
import ClarifyingQuestions from "./ClarifyingQuestions"
import { useCanvasStore, type MindMapNode as MindMapNodeType } from "../store/canvasStore"
import { useToastStore } from "../store/toastStore"
import { useElaborationStore } from "../store/elaborationStore"

// Define nodeTypes outside the component to prevent re-creation on every render
const nodeTypes = {
  mindMapNode: MindMapNode,
}

interface ContextMenuState {
  nodeId: string
  x: number
  y: number
}

function BrainFlowCanvasInner() {
  const nodes = useCanvasStore((state) => state.nodes)
  const edges = useCanvasStore((state) => state.edges)
  const store = useCanvasStore()
  const addToast = useToastStore((state) => state.addToast)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const { fitView } = useReactFlow()
  const prevNodeCount = useRef(nodes.length)
  // Agent thinking state — drives edge animation (static when idle, flowing when thinking)
  const { isLoading: isAgentThinking } = useCopilotChat()

  // AG-UI Feature: useCopilotReadable — automatically share canvas state with the agent
  // The agent always knows what's on the canvas without manual serialization
  useCopilotReadable({
    description: "Current mind map canvas state with all nodes and their relationships",
    value: JSON.stringify({
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes: nodes.map(n => ({ id: n.id, label: n.data.label, type: n.data.nodeType, score: n.data.score })),
      edges: edges.map(e => ({ source: e.source, target: e.target, label: e.label })),
    }),
  })

  // Auto-zoom to fit all nodes when new nodes are added
  useEffect(() => {
    if (nodes.length > prevNodeCount.current) {
      // Small delay to let layout settle
      setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 100)
    }
    prevNodeCount.current = nodes.length
  }, [nodes.length, fitView])

  // --- Register frontend tools via useCopilotAction ---

  useCopilotAction({
    name: "add_node",
    description: "Add a new idea node to the mind map canvas",
    parameters: [
      { name: "id", type: "string", required: true },
      { name: "label", type: "string", required: true },
      { name: "parent_id", type: "string", required: true },
      { name: "node_type", type: "string", required: true },
      { name: "description", type: "string" },
      { name: "color", type: "string" },
    ],
    handler: async ({ id, label, parent_id, node_type, description, color }) => {
      try {
        if (!id || typeof id !== "string" || id.trim() === "") {
          return "Error: 'id' must be a non-empty string"
        }
        if (!label || typeof label !== "string" || label.trim() === "") {
          return "Error: 'label' must be a non-empty string"
        }
        if (!parent_id || typeof parent_id !== "string" || parent_id.trim() === "") {
          return "Error: 'parent_id' must be a non-empty string"
        }
        if (!node_type || typeof node_type !== "string" || node_type.trim() === "") {
          return "Error: 'node_type' must be a non-empty string"
        }

        store.addNode({ id, label, parentId: parent_id, nodeType: node_type, description, color })
        store.runLayout()
        return `Added node: ${label}`
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add node"
        addToast(message)
        return `Error adding node: ${message}`
      }
    },
    // Generative UI: show ghost node while the tool is executing
    render: ({ status, args }) => {
      if (status === "executing" || status === "inProgress") {
        return <GhostNode label={args?.label as string} nodeType={args?.node_type as string} />
      }
      return <></>
    },
  })

  useCopilotAction({
    name: "add_edge",
    description: "Connect two existing nodes with a labeled relationship",
    parameters: [
      { name: "source", type: "string", required: true },
      { name: "target", type: "string", required: true },
      { name: "label", type: "string" },
      { name: "style", type: "string" },
    ],
    handler: async ({ source, target, label, style }) => {
      try {
        if (!source || typeof source !== "string" || source.trim() === "") {
          return "Error: 'source' must be a non-empty string"
        }
        if (!target || typeof target !== "string" || target.trim() === "") {
          return "Error: 'target' must be a non-empty string"
        }

        store.addEdge({ source, target, label, style, animated: true })
        return `Connected ${source} → ${target}`
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to add edge"
        addToast(message)
        return `Error adding edge: ${message}`
      }
    },
  })

  useCopilotAction({
    name: "challenge_node",
    description: "Add a counter-argument or risk to an existing idea",
    parameters: [
      { name: "target_id", type: "string", required: true },
      { name: "challenge_text", type: "string", required: true },
      { name: "severity", type: "string" },
    ],
    handler: async ({ target_id, challenge_text }) => {
      try {
        if (!target_id || typeof target_id !== "string" || target_id.trim() === "") {
          return "Error: 'target_id' must be a non-empty string"
        }
        if (!challenge_text || typeof challenge_text !== "string" || challenge_text.trim() === "") {
          return "Error: 'challenge_text' must be a non-empty string"
        }

        const id = `challenge_${Date.now()}`
        store.addNode({
          id,
          label: challenge_text,
          parentId: target_id,
          nodeType: "challenge",
          color: "red",
        })
        store.runLayout()
        return `Challenged: ${challenge_text}`
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to challenge node"
        addToast(message)
        return `Error challenging node: ${message}`
      }
    },
    render: ({ status, args }) => {
      if (status === "executing" || status === "inProgress") {
        return <GhostNode label={args?.challenge_text as string} nodeType="challenge" />
      }
      return <></>
    },
  })

  useCopilotAction({
    name: "prioritize_nodes",
    description: "Score and recolor nodes by feasibility and impact",
    parameters: [
      { name: "scores", type: "object[]", required: true },
    ],
    handler: async ({ scores }) => {
      try {
        if (!Array.isArray(scores) || scores.length === 0) {
          return "Error: 'scores' must be a non-empty array"
        }

        store.updateNodeBatch(
          scores.map((s: { node_id: string; score: number; color?: string }) => ({
            id: s.node_id,
            score: s.score,
            color: s.color,
          }))
        )
        return `Prioritized ${scores.length} nodes`
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to prioritize nodes"
        addToast(message)
        return `Error prioritizing nodes: ${message}`
      }
    },
    render: ({ status }) => {
      if (status === "executing" || status === "inProgress") {
        return (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="flex items-center gap-3 bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-xl px-4 py-3 shadow-xl animate-pulse">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </div>
              <p className="text-sm text-gray-200 font-medium">Scoring ideas by feasibility...</p>
            </div>
          </div>
        )
      }
      return <></>
    },
  })

  // AG-UI Generative UI: ask_user renders an interactive question panel
  // The handler returns a Promise that resolves when the user clicks an option
  const [pendingQuestion, setPendingQuestion] = useState<{
    question: string
    options: string[]
    resolve: (answer: string) => void
  } | null>(null)

  useCopilotAction({
    name: "ask_user",
    description: "Ask the user a clarifying question with clickable options",
    parameters: [
      { name: "question", type: "string", required: true },
      { name: "options", type: "string[]", required: true },
    ],
    handler: async ({ question, options }) => {
      // Show the question panel and wait for user to answer
      return new Promise<string>((resolve) => {
        setPendingQuestion({
          question,
          options: options || [],
          resolve: (answer: string) => {
            setPendingQuestion(null)
            resolve(`User answered: ${answer}`)
          },
        })
      })
    },
  })

  // elaborate_node — generates a rich document panel on the right (APPENDS sections)
  const setElaboration = useElaborationStore((s) => s.setElaboration)

  useCopilotAction({
    name: "elaborate_node",
    description: "Generate a rich elaboration document for a node with structured sections. Can be called multiple times to add more sections progressively.",
    parameters: [
      { name: "node_id", type: "string", required: true },
      { name: "title", type: "string", required: true },
      { name: "summary", type: "string", required: true },
      { name: "sections_json", type: "string", required: true, description: "JSON string of sections array. Each section: {heading: string, content: string}" },
      { name: "agent_name", type: "string" },
    ],
    handler: async ({ node_id, title, summary, sections_json, agent_name }) => {
      try {
        let sections: Array<{heading?: string; content?: string}> = []
        try {
          sections = JSON.parse(sections_json || "[]")
        } catch {
          sections = [{ heading: "Analysis", content: sections_json || "" }]
        }

        const currentElaboration = useElaborationStore.getState().activeElaboration
        const newSections = sections.map((s) => ({
          heading: s.heading || "Section",
          content: s.content || "",
          agentName: agent_name || "Strategist",
        }))

        if (currentElaboration && currentElaboration.nodeId === node_id) {
          // APPEND to existing elaboration — dedupe by heading (case-insensitive)
          // and upgrade the placeholder summary once the agent provides a real one.
          const existingHeadings = new Set(
            currentElaboration.sections.map((s) => s.heading.toLowerCase().trim())
          )
          const deduped = newSections.filter(
            (s) => !existingHeadings.has(s.heading.toLowerCase().trim())
          )

          const placeholderSummaries = new Set([
            "Generating comprehensive analysis...",
            "Generating analysis...",
          ])
          const shouldUpgradeSummary =
            placeholderSummaries.has(currentElaboration.summary) &&
            summary &&
            summary.trim() !== "" &&
            !placeholderSummaries.has(summary)

          useElaborationStore.setState({
            activeElaboration: {
              ...currentElaboration,
              summary: shouldUpgradeSummary ? summary : currentElaboration.summary,
              sections: [...currentElaboration.sections, ...deduped],
            },
          })
        } else {
          // First call — create new elaboration
          setElaboration({
            nodeId: node_id,
            title,
            summary,
            sections: newSections,
          })
        }
        return `Elaborated: ${title}`
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to elaborate"
        addToast(message)
        return `Error: ${message}`
      }
    },
  })

  // delete_node — removes a node and its edges
  useCopilotAction({
    name: "delete_node",
    description: "Remove a node and its edges from the canvas",
    parameters: [
      { name: "node_id", type: "string", required: true },
    ],
    handler: async ({ node_id }) => {
      try {
        useCanvasStore.setState((state) => ({
          nodes: state.nodes.filter((n) => n.id !== node_id),
          edges: state.edges.filter((e) => e.source !== node_id && e.target !== node_id),
        }))
        store.runLayout()
        return `Deleted node ${node_id}`
      } catch (error) {
        return `Error deleting node: ${error}`
      }
    },
  })

  // --- Canvas event handlers ---

  // Transform edges to apply React Flow styling based on edge data.
  // Edges are static by default and only animate (flowing dashes) while the agent is thinking.
  const styledEdges: Edge[] = useMemo(() => {
    return edges.map((edge) => {
      const baseEdge: Edge = {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: isAgentThinking,
      }

      if (edge.style === "dashed") {
        baseEdge.style = { strokeDasharray: "5 5", stroke: "#64748B", strokeWidth: 2 }
      } else {
        baseEdge.style = { stroke: "#475569", strokeWidth: 2 }
      }

      return baseEdge
    })
  }, [edges, isAgentThinking])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    useCanvasStore.setState((state) => ({
      nodes: applyNodeChanges(changes, state.nodes as Node[]) as MindMapNodeType[],
    }))
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    useCanvasStore.setState((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as typeof state.edges,
    }))
  }, [])

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    useCanvasStore.setState({ selectedNodeId: node.id })
    setContextMenu(null)
    // Zoom in and center on the clicked node
    fitView({ nodes: [node], padding: 0.5, duration: 400, maxZoom: 1.5 })
  }, [fitView])

  const onNodeContextMenu: NodeMouseHandler = useCallback((event, node) => {
    event.preventDefault()
    useCanvasStore.setState({ selectedNodeId: node.id })
    setContextMenu({
      nodeId: node.id,
      x: event.clientX,
      y: event.clientY,
    })
  }, [])

  const onPaneClick = useCallback(() => {
    useCanvasStore.setState({ selectedNodeId: null })
    setContextMenu(null)
  }, [])

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes as Node[]}
        edges={styledEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneClick={onPaneClick}
        fitView
        className="bg-gray-950"
      >
        <Background color="#334155" gap={20} size={1} />
        <Controls className="!bg-gray-800 !border-gray-700 !shadow-lg [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-gray-300 [&>button:hover]:!bg-gray-700" />
        <MiniMap
          nodeColor="#3B82F6"
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-gray-900 !border-gray-700"
        />
      </ReactFlow>

      {/* Right-click context menu */}
      {contextMenu && (
        <NodeContextMenu
          nodeId={contextMenu.nodeId}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* AG-UI Clarifying Questions Panel */}
      {pendingQuestion && (
        <ClarifyingQuestions
          question={pendingQuestion.question}
          options={pendingQuestion.options}
          status="executing"
          onAnswer={pendingQuestion.resolve}
        />
      )}
    </div>
  )
}

// Wrap with ReactFlowProvider so useReactFlow works
function BrainFlowCanvas() {
  return (
    <ReactFlowProvider>
      <BrainFlowCanvasInner />
    </ReactFlowProvider>
  )
}

export default BrainFlowCanvas
