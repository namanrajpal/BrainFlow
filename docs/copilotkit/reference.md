# CopilotKit + AG-UI Reference

CopilotKit is a React framework for building AI-powered copilots. It natively supports the AG-UI protocol for connecting to agent backends.

## Installation

```bash
npm install @copilotkit/react-core @copilotkit/react-ui
```

## Basic Setup

```tsx
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";

function App() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <YourApp />
    </CopilotKit>
  );
}
```

## Key Hooks

### useCopilotAction

Define frontend tools/actions that the agent can invoke:

```tsx
import { useCopilotAction } from "@copilotkit/react-core";

useCopilotAction({
  name: "add_node",
  description: "Add a new idea node to the mind map",
  parameters: [
    { name: "id", type: "string", required: true },
    { name: "label", type: "string", required: true },
    { name: "parent_id", type: "string", required: true },
    { name: "node_type", type: "string", enum: ["idea", "detail", "question", "challenge", "action"] },
    { name: "description", type: "string" },
    { name: "color", type: "string" },
  ],
  handler: async ({ id, label, parent_id, node_type, description, color }) => {
    // This runs when the agent calls add_node
    addNodeToCanvas({ id, label, parent_id, node_type, description, color });
    return `Node "${label}" added successfully`;
  },
  // Optional: render custom UI while tool executes
  render: ({ status, args }) => {
    if (status === "executing") return <NodePlaceholder label={args.label} />;
    return null;
  },
});
```

### useCoAgent

Connect to AG-UI agent backends with shared state:

```tsx
import { useCoAgent } from "@copilotkit/react-core";

const { state, setState, run, stop } = useCoAgent({
  name: "brainflow-agent",
  initialState: {
    nodes: [],
    edges: [],
    mode: "brainstorm",
  },
});
```

### useCopilotReadable

Provide context to the agent about the current UI state:

```tsx
import { useCopilotReadable } from "@copilotkit/react-core";

useCopilotReadable({
  description: "Current mind map state",
  value: JSON.stringify({ nodes, edges }),
});
```

## AG-UI Agent Connection

CopilotKit connects to any AG-UI compatible agent backend via the runtime URL. The backend just needs to emit AG-UI events over SSE.

### Architecture
```
React App + CopilotKit → CopilotKit Runtime → AG-UI Agent Backend
                                                    ↓
                                            Emits AG-UI events (SSE)
```

## Generative UI with Tool Rendering

The most powerful feature for BrainFlow — render React components based on agent tool calls:

```tsx
useCopilotAction({
  name: "expand_node",
  description: "Generate child nodes for an existing node",
  parameters: [
    { name: "parent_id", type: "string", required: true },
    { name: "children", type: "object[]", required: true },
  ],
  handler: async ({ parent_id, children }) => {
    children.forEach(child => addNodeToCanvas(child));
    layoutCanvas();
    return `Added ${children.length} nodes`;
  },
  render: ({ status, args }) => {
    if (status === "inProgress") {
      return <StreamingNodes parentId={args.parent_id} />;
    }
    return null;
  },
});
```

## Direct AG-UI Event Consumption (Without CopilotKit)

If building without CopilotKit, consume AG-UI events directly:

```typescript
async function connectToAgent(prompt: string, graphState: object) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      threadId: crypto.randomUUID(),
      runId: crypto.randomUUID(),
      messages: [{ id: crypto.randomUUID(), role: 'user', content: prompt }],
      tools: BRAINFLOW_TOOLS,
      state: graphState,
      context: [],
      forwardedProps: {},
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      if (event.startsWith('data: ')) {
        const parsed = JSON.parse(event.slice(6));
        handleAgUiEvent(parsed);
      }
    }
  }
}
```

## Resources
- Docs: https://docs.copilotkit.ai/
- GitHub: https://github.com/CopilotKit/CopilotKit
