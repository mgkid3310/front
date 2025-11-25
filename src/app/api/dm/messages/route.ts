import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sourceUid = searchParams.get('source_uid');
    const targetUid = searchParams.get('target_uid');

    if (!sourceUid || !targetUid) {
      return NextResponse.json(
        { error: 'source_uid and target_uid are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/dm/messages?source_uid=${sourceUid}&target_uid=${targetUid}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get messages proxy error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
