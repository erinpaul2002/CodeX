# CodeX: Implementation Plan

This document outlines the phased approach for completing the CodeX Student IDE project. The plan focuses on systematically implementing the remaining features required for a fully functional code execution environment.

## Phase 1: Complete Piston Integration

### 1.1 Backend API Routes

#### HTTP-based Execution (`/api/run/route.ts`)

**Current Status:** API route structure exists with simulated response.

**Implementation Steps:**
1. Replace the mock implementation with actual Piston API integration
2. Properly handle the Piston API response format
3. Add error handling for network failures and invalid responses
4. Implement request validation
5. Add logging for debugging purposes

```typescript
// Example implementation
export async function POST(req: NextRequest) {
  try {
    const { language, code, stdin } = await req.json();
    
    // Validate request
    if (!language || !code) {
      return NextResponse.json(
        { error: 'Language and code are required' },
        { status: 400 }
      );
    }
    
    // Call Piston API
    const response = await fetch(`${PISTON_URL}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language,
        version: '*',
        files: [{ name: 'code', content: code }],
        stdin: stdin || '',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Piston API error: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return NextResponse.json({
      stdout: result.run.output,
      stderr: result.run.stderr,
      exitCode: result.run.code,
    });
  } catch (error) {
    console.error('Code execution error:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
}
```

#### WebSocket Implementation (`/api/exec/route.ts`)

**Current Status:** WebSocket endpoint structure exists but is not functional.

**Implementation Steps:**
1. Implement proper WebSocket handling in Next.js App Router context
2. Establish connection with Piston WebSocket service
3. Set up bidirectional message proxying
4. Implement connection error handling and cleanup
5. Add logging for tracing message flow

```typescript
// Example implementation outline
export async function GET(req: NextRequest) {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket request', { status: 400 });
  }

  try {
    // Use appropriate WebSocket library for Next.js App Router
    const { socket: clientSocket, response } = upgradeWebSocket(req);
    
    // Connect to Piston WebSocket
    const pistonSocket = new WebSocket(`${process.env.PISTON_WS_URL || 'ws://localhost:2000/ws'}`);
    
    // Set up bidirectional proxying
    clientSocket.onmessage = (event) => {
      if (pistonSocket.readyState === WebSocket.OPEN) {
        pistonSocket.send(event.data);
      }
    };
    
    pistonSocket.onmessage = (event) => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.send(event.data);
      }
    };
    
    // Handle connection closure
    clientSocket.onclose = () => {
      if (pistonSocket.readyState === WebSocket.OPEN) {
        pistonSocket.close();
      }
    };
    
    pistonSocket.onclose = () => {
      if (clientSocket.readyState === WebSocket.OPEN) {
        clientSocket.close();
      }
    };
    
    return response;
  } catch (err) {
    console.error('WebSocket error:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

### 1.2 Docker Configuration

**Current Status:** Docker Compose file exists but may need testing.

**Implementation Steps:**
1. Verify Docker Compose configuration
2. Test Piston container startup and API accessibility
3. Ensure proper network communication between frontend and Piston
4. Document container management commands
5. Set up development environment variables

### 1.3 Backend API Enhancements

**Current Status:** Basic API structure exists.

**Implementation Steps:**
1. Implement language detection and validation
2. Add support for custom execution options (timeout, memory limits)
3. Create API endpoints for available languages and versions
4. Implement execution history tracking (optional)
5. Add status endpoint for health monitoring

```typescript
// Example for language listing endpoint
export async function GET(req: NextRequest) {
  try {
    // Call Piston API to get available languages
    const response = await fetch(`${PISTON_URL}/api/v2/runtimes`);
    
    if (!response.ok) {
      throw new Error(`Piston API error: ${response.statusText}`);
    }
    
    const runtimes = await response.json();
    
    // Format the response with just the needed information
    const languages = runtimes.map(runtime => ({
      language: runtime.language,
      version: runtime.version,
      aliases: runtime.aliases || []
    }));
    
    return NextResponse.json({ languages });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available languages' },
      { status: 500 }
    );
  }
}

## Phase 2: Frontend UI Enhancements

### 2.1 Run Button Implementation

**Current Status:** Editor UI exists but lacks run functionality.

**Implementation Steps:**
1. Add a Run button to the editor interface
2. Implement loading indicator during code execution
3. Connect button click to the API call
4. Handle API responses and display in terminal
5. Implement error feedback for failed executions

```tsx
// Example component addition
const runCode = async () => {
  setIsRunning(true);
  
  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, code, stdin: '' }),
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Write output to terminal
      if (terminalComponentRef.current) {
        terminalComponentRef.current.write(term => {
          term.clear();
          if (result.stdout) term.write(result.stdout);
          if (result.stderr) term.write(`\x1b[31m${result.stderr}\x1b[0m`);
          if (result.exitCode !== 0) {
            term.write(`\r\n\x1b[31mProcess exited with code ${result.exitCode}\x1b[0m\r\n`);
          }
        });
      }
    } else {
      // Handle error
      console.error('Execution failed:', result.error);
      // Show error notification
    }
  } catch (error) {
    console.error('Error running code:', error);
    // Show error notification
  } finally {
    setIsRunning(false);
  }
};
```

### 2.2 Complete Language Templates

**Current Status:** Basic language templates implemented, some may be missing.

**Implementation Steps:**
1. Review existing language templates
2. Complete any missing language templates
3. Ensure proper syntax highlighting for all languages
4. Test language switching functionality
5. Improve template code examples

### 2.3 UI Feedback Mechanisms

**Current Status:** Minimal UI feedback for user actions.

**Implementation Steps:**
1. Implement toast notifications for execution results
2. Add progress indicators for long-running operations
3. Improve error visualization in the editor
4. Add keyboard shortcuts for common actions
5. Implement status bar with execution information

## Phase 3: Testing and Optimization

### 3.1 End-to-End Testing

**Implementation Steps:**
1. Test the complete execution flow from editor to terminal
2. Verify WebSocket functionality for interactive programs
3. Test across different languages and code examples
4. Verify error handling and edge cases
5. Test responsive design and mobile compatibility

### 3.2 Performance Optimization

**Implementation Steps:**
1. Optimize API response handling
2. Improve terminal rendering performance
3. Implement efficient state management
4. Optimize editor configuration
5. Add caching where appropriate

### 3.3 Security Considerations

**Implementation Steps:**
1. Review API security
2. Ensure proper input validation
3. Implement rate limiting
4. Review Docker container security
5. Add appropriate Content Security Policy

## Phase 4: Backend Infrastructure & Scaling

### 4.1 Piston Engine Configuration

**Current Status:** Basic Docker setup exists.

**Implementation Steps:**
1. Configure Piston for optimal resource utilization
2. Set appropriate execution time limits and memory constraints
3. Configure supported languages and versions
4. Implement container resource cleanup
5. Set up health checks for the Piston service

### 4.2 Backend Security

**Implementation Steps:**
1. Implement API rate limiting to prevent abuse
2. Set up container isolation to ensure secure code execution
3. Configure network security policies
4. Add validation for all incoming code
5. Implement logging for security monitoring

### 4.3 Scaling Strategy

**Implementation Steps:**
1. Design approach for handling multiple concurrent executions
2. Set up load balancing for Piston containers if needed
3. Implement caching for frequently executed code patterns
4. Configure container resource limits
5. Document scaling architecture

## Phase 5: Deployment Preparation

### 5.1 Environment Configuration

**Implementation Steps:**
1. Set up production environment variables
2. Configure build process for production
3. Prepare deployment scripts
4. Document deployment requirements
5. Test with production settings

### 5.2 Documentation

**Implementation Steps:**
1. Update API documentation
2. Create user guide
3. Document code architecture
4. Create operation manual for administrators
5. Document troubleshooting procedures

## Next Immediate Steps

To begin implementation, the following tasks should be prioritized:

1. **Implement actual Piston API integration** in `/api/run/route.ts`
2. **Add the Run button** to the editor interface with loading states
3. **Test Docker setup** with the Piston container
4. **Complete language templates** in the Editor component
5. **Create language listing endpoint** to dynamically fetch supported languages
6. **Implement proper error handling** for execution failures
7. **Set up appropriate container limits** for security and resource management

These tasks will provide the core functionality needed for code execution, establishing a foundation for the remaining features.
