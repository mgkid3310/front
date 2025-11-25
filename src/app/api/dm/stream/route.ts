import { NextRequest } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sourceUid = searchParams.get('source_uid');
    const targetUid = searchParams.get('target_uid');

    if (!sourceUid || !targetUid) {
      return new Response('source_uid and target_uid are required', { status: 400 });
    }

    // Connect to backend SSE stream
    const backendResponse = await fetch(
      `${BACKEND_URL}/dm/stream?source_uid=${sourceUid}&target_uid=${targetUid}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          Accept: 'text/event-stream',
        },
      }
    );

    if (!backendResponse.ok) {
      return new Response('Failed to connect to backend stream', {
        status: backendResponse.status,
      });
    }

    if (!backendResponse.body) {
      return new Response('No response body from backend', { status: 500 });
    }

    // Create a TransformStream to forward SSE data
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Stream backend response to client
    (async () => {
      try {
        const reader = backendResponse.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Forward the chunk to client
          const text = decoder.decode(value, { stream: true });
          await writer.write(encoder.encode(text));
        }
      } catch (error) {
        console.error('Stream proxy error:', error);
      } finally {
        writer.close();
      }
    })();

    // Return SSE response
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('SSE proxy error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// Disable body parsing for streaming
export const dynamic = 'force-dynamic';
