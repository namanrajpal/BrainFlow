# AG-UI JavaScript/TypeScript Client SDK

## Installation

```bash
npm install @ag-ui/client @ag-ui/core
```

## HttpAgent

The `HttpAgent` connects to remote AI agents over HTTP, transforming HTTP event streams into standard AG-UI events.

### Configuration

```typescript
import { HttpAgent } from "@ag-ui/client"

const agent = new HttpAgent({
  url: "https://api.example.com/v1/agent",
  headers: {
    Authorization: "Bearer your-api-key",
  },
})
```

### Running an Agent

```typescript
const result = agent.runAgent({
  runId: "run_123",
  threadId: "thread_456",
  messages: [{ id: "msg_1", role: "user", content: "Hello" }],
  tools: [myTool],
  state: {},
})
```

### Event Subscription

Subscribe to agent events with handlers:

```typescript
agent.runAgent({
  runId: "123",
  tools: [],
  messages: []
}).subscribe({
  next: (event) => {
    switch (event.type) {
      case "RUN_STARTED":
        console.log("Agent started");
        break;
      case "TEXT_MESSAGE_CONTENT":
        console.log("Text:", event.delta);
        break;
      case "TOOL_CALL_START":
        console.log("Tool:", event.toolCallName);
        break;
      case "TOOL_CALL_ARGS":
        console.log("Args chunk:", event.delta);
        break;
      case "TOOL_CALL_END":
        console.log("Tool call complete");
        break;
      case "RUN_FINISHED":
        console.log("Done");
        break;
    }
  }
})
```

### Event Handler Pattern (CopilotKit style)

```typescript
agent.runAgent({
  onTextMessageStartEvent: () => { /* message starting */ },
  onTextMessageContentEvent: ({ event }) => {
    appendText(event.delta);
  },
  onTextMessageEndEvent: () => { /* message complete */ },
  onToolCallStartEvent: ({ event }) => {
    createPlaceholder(event.toolCallId, event.toolCallName);
  },
  onToolCallArgsEvent: ({ event }) => {
    appendArgs(event.toolCallId, event.delta);
  },
  onToolCallEndEvent: ({ event }) => {
    finalizeToolCall(event.toolCallId);
  },
  onToolCallResultEvent: ({ event }) => {
    showResult(event.toolCallId, event.content);
  },
})
```

### Request Cancellation

```typescript
agent.abortRun(); // Terminates current HTTP request via AbortController
```

---

## AbstractAgent

Base class for all agents. Extend to create custom agent implementations:

```typescript
import { AbstractAgent } from "@ag-ui/client"

class SimpleAgent extends AbstractAgent {
  run(input: RunAgentInput): RunAgent {
    return () => new Observable<BaseEvent>((observer) => {
      observer.next({ type: EventType.RUN_STARTED, threadId: "t1", runId: "r1" })
      // Emit events...
      observer.complete()
    })
  }
}
```

---

## Tool Definition (Frontend)

```typescript
const addNodeTool = {
  name: "add_node",
  description: "Add a new idea node to the mind map",
  parameters: {
    type: "object",
    properties: {
      id: { type: "string" },
      label: { type: "string", description: "Short title (3-6 words)" },
      description: { type: "string" },
      parent_id: { type: "string" },
      node_type: { type: "string", enum: ["idea", "detail", "question", "challenge", "action"] }
    },
    required: ["id", "label", "parent_id", "node_type"]
  }
}

// Pass tools to agent
agent.runAgent({ tools: [addNodeTool], ... })
```

---

## Tool Call Lifecycle (What Frontend Receives)

```
1. ToolCallStart → { toolCallId: "tc1", toolCallName: "add_node" }
2. ToolCallArgs  → { toolCallId: "tc1", delta: '{"id":"n1","label":"Inv' }
3. ToolCallArgs  → { toolCallId: "tc1", delta: 'oice Auto"}' }
4. ToolCallEnd   → { toolCallId: "tc1" }
```

Frontend accumulates deltas, parses JSON when complete, and renders the result.

---

## State Management (Frontend)

```typescript
import { applyPatch } from "fast-json-patch"

// Handle state events
case "STATE_SNAPSHOT":
  state = event.snapshot;
  break;

case "STATE_DELTA":
  const result = applyPatch(state, event.delta, true, false);
  state = result.newDocument;
  break;
```
