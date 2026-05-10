# AG-UI State Management

## Overview

AG-UI enables bidirectional state synchronization through a structured data object that persists across interactions. Both agent and frontend can access and modify state.

## State Synchronization Methods

### STATE_SNAPSHOT Events

Complete state representations, used:
- At interaction start to establish initial state
- After connection interruptions for re-synchronization
- When major changes require complete refresh

```typescript
interface StateSnapshotEvent {
  type: EventType.STATE_SNAPSHOT
  snapshot: any // Complete state object
}
```

Frontend should replace its existing state model entirely with the snapshot contents.

### STATE_DELTA Events

Incremental updates using JSON Patch format (RFC 6902):

```typescript
interface StateDeltaEvent {
  type: EventType.STATE_DELTA
  delta: JsonPatchOperation[] // Array of JSON Patch operations
}
```

## JSON Patch Operations (RFC 6902)

```json
// Add
{ "op": "add", "path": "/nodes/-", "value": { "id": "n1", "label": "New Idea" } }

// Replace
{ "op": "replace", "path": "/nodes/0/color", "value": "green" }

// Remove
{ "op": "remove", "path": "/nodes/2" }

// Move
{ "op": "move", "path": "/completed/0", "from": "/pending/0" }
```

## Frontend Implementation

```typescript
import { applyPatch } from "fast-json-patch"

function handleStateEvent(event, currentState) {
  switch (event.type) {
    case "STATE_SNAPSHOT":
      return event.snapshot;

    case "STATE_DELTA":
      try {
        const result = applyPatch(currentState, event.delta, true, false);
        return result.newDocument;
      } catch (error) {
        console.warn("Failed to apply state patch");
        return currentState;
      }
  }
}
```

## Best Practices

- Send snapshots only when establishing baselines
- Favor deltas for incremental changes to minimize bandwidth
- Design state structures supporting partial updates
- Implement conflict resolution strategies
- Include error recovery and re-synchronization
- Avoid storing sensitive data in shared state
