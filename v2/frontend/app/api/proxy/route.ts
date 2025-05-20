import { NextRequest, NextResponse } from 'next/server';

// Get the Piston API URL from environment or use service name in Docker
const PISTON_URL = process.env.PISTON_URL || 'http://api:2000';
// When running in Docker Compose network, use service name 'api'
// When running locally outside Docker, keep using 'localhost'

export async function POST(req: NextRequest) {
  try {
    // Get the path from the request, e.g. /api/proxy/execute -> /execute
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/proxy', '');
    
    // Forward the request to Piston API
    const response = await fetch(`${PISTON_URL}/api/v2${path}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.body,
    });

    // Return the response
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Proxy error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Proxy error: ${errorMessage}` },
      { status: 500 }
    );
  }
}