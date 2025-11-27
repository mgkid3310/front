import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const path = (await params).path.join('/');
  const url = `${BACKEND_URL}/${path}${request.nextUrl.search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const body =
      request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : undefined;

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      // @ts-expect-error - duplex is needed for streaming bodies in some environments, though blob() usually handles it
      duplex: 'half',
    });

    // Handle SSE and other streaming responses
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      return new NextResponse(response.body, {
        status: response.status,
        headers: response.headers,
      });
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers,
      });
    }

    const data = await response.blob();
    return new NextResponse(data, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error(`Proxy error for ${path}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
