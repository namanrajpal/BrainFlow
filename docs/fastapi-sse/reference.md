# FastAPI SSE (Server-Sent Events) Reference

## Overview

For AG-UI, we use FastAPI with `sse-starlette` to stream events from the backend to the frontend over Server-Sent Events.

## Installation

```bash
pip install fastapi uvicorn sse-starlette
```

## Basic SSE Endpoint with FastAPI

```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
import asyncio
import json

app = FastAPI()

@app.post("/api/stream")
async def stream_endpoint(request: Request):
    async def event_generator():
        for i in range(10):
            data = json.dumps({"type": "TEXT_MESSAGE_CONTENT", "delta": f"chunk {i}"})
            yield f"data: {data}\n\n"
            await asyncio.sleep(0.1)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )
```

## Using sse-starlette (Recommended)

```python
from fastapi import FastAPI, Request
from sse_starlette import EventSourceResponse
import asyncio

app = FastAPI()

@app.post("/api/stream")
async def stream_endpoint(request: Request):
    async def event_generator():
        for i in range(10):
            if await request.is_disconnected():
                break
            yield {"data": json.dumps({"type": "event", "payload": i})}
            await asyncio.sleep(0.1)
    
    return EventSourceResponse(event_generator())
```

## EventSourceResponse Configuration

```python
EventSourceResponse(
    content=event_generator(),    # async generator
    ping=15,                       # ping interval in seconds (0 to disable)
    send_timeout=30,              # timeout for send operations
    headers={"X-Custom": "value"} # additional headers
)
```

## ServerSentEvent (Structured Events)

```python
from sse_starlette import ServerSentEvent

event = ServerSentEvent(
    data="Custom message",     # event payload
    event="notification",      # event type/name
    id="msg-123",             # unique ID for reconnection
    retry=5000                # reconnection delay in ms
)
```

## AG-UI Compatible SSE Endpoint

```python
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ag_ui.core import (
    RunAgentInput, EventType,
    RunStartedEvent, RunFinishedEvent, RunErrorEvent,
    TextMessageChunkEvent, ToolCallChunkEvent,
)
from ag_ui.encoder import EventEncoder

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/stream")
async def agent_stream(input_data: RunAgentInput, request: Request):
    encoder = EventEncoder(accept=request.headers.get("accept"))

    async def generate():
        try:
            # 1. Signal run start
            yield encoder.encode(RunStartedEvent(
                type=EventType.RUN_STARTED,
                thread_id=input_data.thread_id,
                run_id=input_data.run_id,
            ))

            # 2. Stream tool calls (e.g., add_node)
            tool_call_id = str(uuid.uuid4())
            yield encoder.encode(ToolCallChunkEvent(
                type=EventType.TOOL_CALL_CHUNK,
                tool_call_id=tool_call_id,
                tool_call_name="add_node",
                delta='{"id":"n1","label":"Smart Invoicing","parent_id":"root","node_type":"idea"}',
            ))

            # 3. Stream text reasoning
            msg_id = str(uuid.uuid4())
            yield encoder.encode(TextMessageChunkEvent(
                type=EventType.TEXT_MESSAGE_CHUNK,
                message_id=msg_id,
                delta="Exploring key pain points for freelancers...",
            ))

            # 4. Signal completion
            yield encoder.encode(RunFinishedEvent(
                type=EventType.RUN_FINISHED,
                thread_id=input_data.thread_id,
                run_id=input_data.run_id,
            ))

        except Exception as e:
            yield encoder.encode(RunErrorEvent(
                type=EventType.RUN_ERROR,
                message=str(e),
            ))

    return StreamingResponse(generate(), media_type=encoder.get_content_type())
```

## Client Disconnect Detection

```python
async def event_generator(request: Request):
    while True:
        if await request.is_disconnected():
            break
        yield {"data": "heartbeat"}
        await asyncio.sleep(1)
```

## Frontend SSE Consumption (fetch)

```typescript
async function consumeSSE(url: string, body: object) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(body),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        handleEvent(data);
      }
    }
  }
}
```

## Frontend SSE with EventSource (GET only)

```typescript
// Note: EventSource only supports GET requests
// For POST-based AG-UI, use fetch with streaming (above)
const eventSource = new EventSource('/api/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleEvent(data);
};

eventSource.onerror = () => {
  eventSource.close();
};
```

## Best Practices

1. Always check `request.is_disconnected()` in async generators
2. Use `X-Accel-Buffering: no` header for Nginx reverse proxy
3. Include CORS middleware for cross-origin frontend
4. Use `await asyncio.sleep(0)` between yields for cancellation handling
5. Implement client-side reconnection with exponential backoff
