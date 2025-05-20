import { NextResponse } from 'next/server';
import piston from 'piston-client';

// Create piston client with server URL from environment variables
const createPistonClient = () => {
  // For local development use localhost, for Docker use the service name
  const serverUrl =
    process.env.NODE_ENV === 'production'
      ? process.env.PISTON_URL || 'http://api:2000'
      : 'http://localhost:2000';

  console.log('Connecting to Piston API at:', serverUrl);
  return piston({ server: serverUrl });
};

export async function GET() {
  try {
    const client = createPistonClient();
    
    // Try using piston-client first
    try {
      console.log('Attempting to fetch runtimes using piston-client...');
      const runtimes = await client.runtimes();
      
      // Check if we got a valid response
      if (!runtimes || !Array.isArray(runtimes) || runtimes.length === 0) {
        throw new Error('Invalid or empty runtimes response');
      }
      
      return NextResponse.json(runtimes);
    } 
    catch (clientError) {
      // If client fails, try direct fetch
      console.error('Piston client failed, falling back to direct fetch:', clientError);
      
      // Determine API URL based on environment
      const directUrl = process.env.NODE_ENV === 'production'
        ? 'http://api:2000/api/v2/runtimes'
        : 'http://localhost:2000/api/v2/runtimes';
        
      console.log('Attempting direct fetch from:', directUrl);
      
      // Add timeout to fetch to avoid hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(directUrl, { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Direct API request failed: ${response.status}`);
        }
        
        const result = await response.json();
        if (!result || !Array.isArray(result)) {
          throw new Error('Invalid response format from direct API');
        }
        
        return NextResponse.json(result);
      }
      catch (fetchError) {
        console.error('Direct fetch also failed:', fetchError);
        throw fetchError; // Re-throw to be caught by outer catch
      }
    }
  } 
  catch (error) {
    console.error('Error fetching runtimes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: `Could not connect to code execution service: ${errorMessage}`,
        details: {
          env: process.env.NODE_ENV,
          pistonUrl: process.env.PISTON_URL || 'not set',
          // Don't include sensitive information
        }
      },
      { status: 500 }
    );
  }
}