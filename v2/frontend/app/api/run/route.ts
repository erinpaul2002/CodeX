import { NextRequest, NextResponse } from 'next/server';
import piston from 'piston-client';

// Create piston client with server URL from environment variables
const createPistonClient = () => {
  // For local development use localhost, for Docker use the service name
  const serverUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PISTON_URL || 'http://api:2000'  
    : 'http://localhost:2000';
  
  console.log('Connecting to Piston API at:', serverUrl);
  return piston({ server: serverUrl });
};

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const { language, code, stdin, args = [], timeout } = await req.json();

    // Validate required fields
    if (!language || !code) {
      return NextResponse.json(
        { error: 'Language and code are required' },
        { status: 400 }
      );
    }

    console.log(`Executing ${language} code: ${code.substring(0, 100)}${code.length > 100 ? '...' : ''}`);
    
    // Initialize piston client
    const client = createPistonClient();
    
    try {
      // Execute code using piston client
      let result;
      try {
        result = await client.execute({
          language,
          version: '*', // Use latest version
          files: [{ 
            name: `main.${getFileExtension(language)}`,
            content: code 
          }],
          stdin: stdin || '',
          args: args,
          compileTimeout: timeout?.compile || 10000,
          runTimeout: timeout?.run || 3000,
          compileMemoryLimit: -1,
          runMemoryLimit: -1
        });
      } catch (clientError) {
        console.log('Piston client failed, falling back to direct fetch:', clientError);
        
        // Fall back to direct fetch if client fails
        const directUrl = 'http://localhost:2000/api/v2/execute';
        const directResponse = await fetch(directUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language,
            version: '*',
            files: [{ name: `main.${getFileExtension(language)}`, content: code }],
            stdin: stdin || '',
            args: args || [],
            compile_timeout: timeout?.compile || 10000,
            run_timeout: timeout?.run || 3000,
            compile_memory_limit: -1,
            run_memory_limit: -1
          })
        });
        
        if (!directResponse.ok) {
          throw new Error(`Direct API request failed: ${directResponse.status}`);
        }
        
        result = await directResponse.json();
      }
      
      // Check if execution was successful
      if (!result || result.success === false) {
        const errorMsg = result?.error?.message || 'Unknown execution error';
        console.error('Execution failed:', errorMsg);
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }

      // Transform the response to match your existing API format
      return NextResponse.json({
        language: result.language,
        version: result.version,
        stdout: result.run.stdout,
        stderr: result.run.stderr,
        output: result.run.output,
        exitCode: result.run.code,
        signal: result.run.signal,
        executionTime: result.run.time
      });
      
    } catch (execError) {
      console.error('Piston execution error:', execError);
      const errorMessage = execError instanceof Error ? execError.message : 'Code execution failed';
      return NextResponse.json(
        { error: `Execution error: ${errorMessage}` },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to execute code: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Gets the appropriate file extension for a given programming language
 */
function getFileExtension(language: string): string {
  const extensions: Record<string, string> = {
    python: 'py',
    javascript: 'js',
    nodejs: 'js',
    typescript: 'ts',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    csharp: 'cs',
    go: 'go',
    php: 'php',
    ruby: 'rb',
    rust: 'rs',
    swift: 'swift',
    kotlin: 'kt',
    scala: 'scala',
    perl: 'pl',
    r: 'r',
    haskell: 'hs',
    lua: 'lua'
  };

  return extensions[language.toLowerCase()] || 'txt';
}
