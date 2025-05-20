import { NextResponse } from 'next/server';

export async function GET() {
  // URLs to test
  const urls = [
    'http://localhost:2000/api/v2/runtimes',
    'http://api:2000/api/v2/runtimes',
    process.env.PISTON_URL ? `${process.env.PISTON_URL}/api/v2/runtimes` : null
  ].filter(Boolean) as string[];
  
  interface ResultEntry {
    status?: number;
    success: boolean;
    timestamp: string;
    error?: string;
  }
  
  const results: Record<string, ResultEntry> = {};
  
  for (const url of urls) {
    try {
      // Add timeout to avoid hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      results[url] = {
        status: response.status,
        success: response.ok,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      results[url] = {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  return NextResponse.json({
    diagnostics: results,
    environment: process.env.NODE_ENV,
    server: {
      platform: process.platform,
      timestamp: new Date().toISOString()
    }
  });
}