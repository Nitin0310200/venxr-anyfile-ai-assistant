"""
backend/chat/views.py
Django ASGI Streaming View implementing Server-Sent Events (SSE) with upstream cancellation.
"""

import json
import logging
import asyncio
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Thread, Message, FileAttachment

logger = logging.getLogger(__name__)

@csrf_exempt
async def chat_stream_view(request):
    """
    ASGI Streaming endpoint for VenXR Chat.
    Yields SSE events:
      - event: node_transition
      - event: token
      - event: file
      - event: done
    
    CANCELLATION:
    If the user clicks 'Stop' in the React UI, the HTTP connection closes.
    Asyncio catches the disconnection, cancels the generator, and halts upstream LLM streaming.
    """
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
        thread_id = data.get("threadId")
        messages = data.get("messages", [])
        attachments = data.get("attachments", [])
    except Exception as e:
        return JsonResponse({"error": f"Invalid JSON payload: {str(e)}"}, status=400)

    async def sse_event_stream():
        try:
            # 1. Emit Initial Inbound Transition
            if attachments and len(attachments) > 0:
                yield f"data: {json.dumps({'event': 'node_transition', 'node': 'file_parser_node'})}\n\n"
                await asyncio.sleep(0.3)

            yield f"data: {json.dumps({'event': 'node_transition', 'node': 'agent_node'})}\n\n"
            await asyncio.sleep(0.2)

            yield f"data: {json.dumps({'event': 'node_transition', 'node': 'answer_node'})}\n\n"

            # 2. Simulated Token Streaming
            sample_response = (
                "I have processed your multi-turn conversation and context. "
                "The LangGraph agent maintains coherence across extended threads using sliding-window memory "
                "and durable PostgreSQL checkpointing."
            )

            for word in sample_response.split(" "):
                yield f"data: {json.dumps({'event': 'token', 'token': word + ' '})}\n\n"
                await asyncio.sleep(0.04)

            # 3. Checkpointer & Completion
            yield f"data: {json.dumps({'event': 'node_transition', 'node': 'checkpointer'})}\n\n"
            yield "data: [DONE]\n\n"

        except asyncio.CancelledError:
            # True upstream cancellation caught when React AbortController closes socket
            logger.info("Client aborted SSE stream for thread %s. Halting upstream LLM.", thread_id)
            raise
        except Exception as exc:
            logger.error("SSE stream error: %s", exc)
            yield f"data: {json.dumps({'event': 'error', 'error': str(exc)})}\n\n"

    response = StreamingHttpResponse(
        sse_event_stream(),
        content_type="text/event-stream"
    )
    response["Cache-Control"] = "no-cache, no-transform"
    response["X-Accel-Buffering"] = "no" # Prevent Nginx proxy buffering
    return response
