# AG-UI Event Types Reference

## EventType Enum (Python)

```python
from ag_ui.core import EventType

class EventType(str, Enum):
    TEXT_MESSAGE_START = "TEXT_MESSAGE_START"
    TEXT_MESSAGE_CONTENT = "TEXT_MESSAGE_CONTENT"
    TEXT_MESSAGE_END = "TEXT_MESSAGE_END"
    TEXT_MESSAGE_CHUNK = "TEXT_MESSAGE_CHUNK"
    TOOL_CALL_START = "TOOL_CALL_START"
    TOOL_CALL_ARGS = "TOOL_CALL_ARGS"
    TOOL_CALL_END = "TOOL_CALL_END"
    TOOL_CALL_CHUNK = "TOOL_CALL_CHUNK"
    TOOL_CALL_RESULT = "TOOL_CALL_RESULT"
    STATE_SNAPSHOT = "STATE_SNAPSHOT"
    STATE_DELTA = "STATE_DELTA"
    MESSAGES_SNAPSHOT = "MESSAGES_SNAPSHOT"
    RUN_STARTED = "RUN_STARTED"
    RUN_FINISHED = "RUN_FINISHED"
    RUN_ERROR = "RUN_ERROR"
    STEP_STARTED = "STEP_STARTED"
    STEP_FINISHED = "STEP_FINISHED"
    REASONING_START = "REASONING_START"
    REASONING_MESSAGE_START = "REASONING_MESSAGE_START"
    REASONING_MESSAGE_CONTENT = "REASONING_MESSAGE_CONTENT"
    REASONING_MESSAGE_END = "REASONING_MESSAGE_END"
    REASONING_END = "REASONING_END"
    RAW = "RAW"
    CUSTOM = "CUSTOM"
```

---

## Lifecycle Events

### RunStarted
Initiates an agent run with a unique execution context.
- `type`: "RUN_STARTED"
- `threadId`: string — conversation thread ID
- `runId`: string — unique run identifier
- `parentRunId`: string | undefined
- `input`: object | undefined

### RunFinished
Marks normal completion of an agent run.
- `type`: "RUN_FINISHED"
- `outcome`: `{ type: "success" }` | `{ type: "interrupt", interrupts: array }`
- `result`: object | undefined

### RunError
Signals an unrecoverable error.
- `type`: "RUN_ERROR"
- `message`: string
- `code`: string | undefined

### StepStarted / StepFinished
Granular progress visibility for multi-phase operations.
- `stepName`: string

---

## Text Message Events

### TextMessageStart
Initializes a new streaming text message.
- `type`: "TEXT_MESSAGE_START"
- `messageId`: string
- `role`: "developer" | "system" | "assistant" | "user" | "tool"

### TextMessageContent
A chunk of content in a streaming text message.
- `type`: "TEXT_MESSAGE_CONTENT"
- `messageId`: string
- `delta`: string (non-empty text chunk)

### TextMessageEnd
Marks completion of a streaming text message.
- `type`: "TEXT_MESSAGE_END"
- `messageId`: string

### TextMessageChunk (Convenience)
Auto-expands to Start → Content → End.
- `type`: "TEXT_MESSAGE_CHUNK"
- `messageId`: string | undefined (required on first chunk)
- `role`: string | undefined (defaults to "assistant")
- `delta`: string | undefined

---

## Tool Call Events

### ToolCallStart
Agent is invoking a tool.
- `type`: "TOOL_CALL_START"
- `toolCallId`: string
- `toolCallName`: string
- `parentMessageId`: string | undefined

### ToolCallArgs
Incremental parts of the tool's arguments.
- `type`: "TOOL_CALL_ARGS"
- `toolCallId`: string
- `delta`: string (JSON fragment)

### ToolCallEnd
Marks completion of a tool call.
- `type`: "TOOL_CALL_END"
- `toolCallId`: string

### ToolCallResult
Output from a completed tool execution.
- `type`: "TOOL_CALL_RESULT"
- `messageId`: string
- `toolCallId`: string
- `content`: string | object
- `role`: "tool" | undefined

### ToolCallChunk (Convenience)
Auto-expands to Start → Args → End.
- `type`: "TOOL_CALL_CHUNK"
- `toolCallId`: string | undefined (required on first)
- `toolCallName`: string | undefined (required on first)
- `delta`: string | undefined

---

## State Management Events

### StateSnapshot
Complete representation of agent's current state.
- `type`: "STATE_SNAPSHOT"
- `snapshot`: object

### StateDelta
Incremental updates using JSON Patch (RFC 6902).
- `type`: "STATE_DELTA"
- `delta`: array of JSON Patch operations

### MessagesSnapshot
Complete conversation history.
- `type`: "MESSAGES_SNAPSHOT"
- `messages`: array

---

## Event Consumption Pattern

```javascript
function handleEvent(event) {
  switch(event.type) {
    case "RUN_STARTED":
      initializeUI(event.runId);
      break;
    case "TEXT_MESSAGE_START":
      createMessageBubble(event.messageId);
      break;
    case "TEXT_MESSAGE_CONTENT":
      appendToMessage(event.messageId, event.delta);
      break;
    case "TOOL_CALL_START":
      displayToolInvocation(event.toolCallName);
      break;
    case "TOOL_CALL_ARGS":
      appendToolArgs(event.toolCallId, event.delta);
      break;
    case "TOOL_CALL_END":
      finalizeToolCall(event.toolCallId);
      break;
    case "STATE_SNAPSHOT":
      replaceState(event.snapshot);
      break;
    case "STATE_DELTA":
      applyJsonPatches(event.delta);
      break;
    case "RUN_FINISHED":
      showComplete();
      break;
  }
}
```

## Key Patterns

- **Start-Content-End**: TextMessage*, ToolCall* events stream content incrementally
- **Snapshot-Delta**: StateSnapshot establishes baseline; StateDelta provides efficient updates
- **Lifecycle**: RunStarted initiates; RunFinished/RunError terminates runs
- **Convenience Chunks**: TextMessageChunk and ToolCallChunk reduce boilerplate
