# AG-UI Tools Reference

## Tool Definition Interface

Tools in AG-UI use JSON Schema for parameter definitions:

```typescript
interface Tool {
  name: string
  description: string
  parameters: {
    type: "object"
    properties: { /* tool-specific parameters */ }
    required: string[]
  }
}
```

## Frontend Tool Registration

Tools are defined in the frontend and passed during agent execution:

```typescript
const userConfirmationTool = {
  name: "confirmAction",
  description: "Ask the user to confirm a specific action before proceeding",
  parameters: {
    type: "object",
    properties: {
      action: { type: "string" },
      importance: {
        type: "string",
        enum: ["low", "medium", "high", "critical"]
      }
    },
    required: ["action"]
  }
}

agent.runAgent({ tools: [userConfirmationTool] })
```

## Tool Call Lifecycle

The standardized event sequence:

### 1. ToolCallStart — Initiates the call
```typescript
{ type: EventType.TOOL_CALL_START, toolCallId: "tool-123", toolCallName: "confirmAction" }
```

### 2. ToolCallArgs — Streams JSON arguments incrementally
```typescript
{ type: EventType.TOOL_CALL_ARGS, toolCallId: "tool-123", delta: '{"act' }
{ type: EventType.TOOL_CALL_ARGS, toolCallId: "tool-123", delta: 'ion":"Deploy to prod"}' }
```

### 3. ToolCallEnd — Marks completion
```typescript
{ type: EventType.TOOL_CALL_END, toolCallId: "tool-123" }
```

## Tool Results

After frontend execution, results return as tool messages:

```typescript
{
  id: "result-789",
  role: "tool",
  content: "true",
  toolCallId: "tool-123"
}
```

## BrainFlow Tool Definitions

For our mind map use case:

```json
[
  {
    "name": "add_node",
    "description": "Add a new idea node to the mind map",
    "parameters": {
      "type": "object",
      "properties": {
        "id": {"type": "string"},
        "label": {"type": "string", "description": "Short title (3-6 words)"},
        "description": {"type": "string"},
        "parent_id": {"type": "string"},
        "node_type": {"type": "string", "enum": ["idea", "detail", "question", "challenge", "action"]},
        "color": {"type": "string"}
      },
      "required": ["id", "label", "parent_id", "node_type"]
    }
  },
  {
    "name": "add_edge",
    "description": "Connect two existing nodes",
    "parameters": {
      "type": "object",
      "properties": {
        "source": {"type": "string"},
        "target": {"type": "string"},
        "label": {"type": "string"},
        "style": {"type": "string", "enum": ["solid", "dashed", "dotted"]}
      },
      "required": ["source", "target"]
    }
  }
]
```

## CopilotKit Integration (React)

```tsx
useCopilotAction({
  name: "confirmAction",
  description: "Ask the user to confirm an action",
  parameters: { /* schema */ },
  handler: async ({ action }) => {
    const confirmed = await showConfirmDialog(action)
    return confirmed ? "approved" : "rejected"
  }
})
```
