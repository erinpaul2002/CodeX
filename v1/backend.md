# CodeX Backend Documentation

## Overview
The CodeX backend is designed to safely execute Python code submitted from the frontend, providing real-time input/output interaction via WebSockets. It uses Docker for code isolation and implements security measures to protect against malicious code execution.

## Backend Architecture

### Core Components
1. **Express Server**: Handles HTTP requests and serves API endpoints
2. **WebSocket Server**: Manages real-time communication for code execution I/O
3. **Docker Container Manager**: Creates, manages, and destroys isolated execution environments
4. **Code Execution Service**: Orchestrates the code execution workflow
5. **Security Layer**: Implements rate limiting, code sanitization, and resource constraints

### Technology Stack
- **Node.js & Express**: Core server platform
- **Socket.IO**: WebSocket implementation for real-time communication
- **Dockerode**: Node.js Docker API client
- **Docker**: Containerization for isolated code execution
- **Rate Limiter**: To prevent abuse of the service
- **Express Validator**: For request validation and sanitization

## Workflow Implementation

### Project Setup
1. Initialize Node.js project with Express and TypeScript
   ```bash
   mkdir -p backend/src
   cd backend
   npm init -y
   npm install express socket.io dockerode cors express-rate-limit express-validator uuid
   npm install -D typescript @types/express @types/node @types/socket.io @types/dockerode @types/uuid
   ```

2. Configure TypeScript
   ```bash
   npx tsc --init
   ```

3. Project structure
   ```
   backend/
   ├── src/
   │   ├── index.ts                   # Entry point
   │   ├── config/                    # Configuration settings
   │   ├── controllers/               # API controllers
   │   ├── services/                  # Business logic services
   │   │   ├── docker.service.ts      # Docker container management
   │   │   ├── execution.service.ts   # Code execution orchestration
   │   │   └── socket.service.ts      # WebSocket communication  
   │   ├── middleware/                # Express middleware
   │   └── types/                     # TypeScript type definitions
   ├── Dockerfile                     # Dockerfile for backend service
   ├── docker-compose.yml             # Orchestration for backend and python container
   └── package.json                   # Node.js package definition
   ```

### Docker Container Management

1. Create Python Docker image (Dockerfile.python)
   ```dockerfile
   FROM python:3.9-slim
   
   # Install essential libraries
   RUN pip install numpy pandas matplotlib
   
   # Set working directory
   WORKDIR /code
   
   # Set non-root user for security
   RUN useradd -m coder
   USER coder
   
   # Default command - will be overridden at runtime
   CMD ["python", "-c", "print('Container ready')"]
   ```

2. Docker Service Implementation (docker.service.ts)
   - Create container with resource limits
   - Stream stdout/stderr
   - Provide stdin when needed
   - Clean up containers after execution

### WebSocket Communication

1. Socket.IO Server Setup
   - Handle client connections
   - Create rooms for each execution session
   - Define event handlers for code execution I/O

2. Events to Implement
   - `connect`: Initial WebSocket connection
   - `execute`: Request to execute code
   - `output`: Send program output to frontend
   - `error`: Send error messages to frontend
   - `input_required`: Signal frontend that input is needed
   - `input`: Receive user input from frontend
   - `execution_complete`: Signal execution completion

### Code Execution API

1. REST Endpoint: `/api/execute`
   - Method: POST
   - Request validation
   - Session ID generation
   - Code sanitization
   - Docker container creation request

### Code Execution Flow

1. Code Execution Service
   ```typescript
   class ExecutionService {
     // Execute code and manage I/O
     async executeCode(code: string, language: string, sessionId: string): Promise<void>;
     
     // Stream output from container to WebSocket
     private streamOutput(container: Docker.Container, sessionId: string): void;
     
     // Handle input requests
     private handleInput(container: Docker.Container, sessionId: string, input: string): void;
     
     // Clean up resources
     private cleanup(container: Docker.Container): Promise<void>;
   }
   ```

2. Execution Workflow
   - Receive code execution request from frontend
   - Generate unique session ID
   - Create isolated Docker container
   - Write code to file in container
   - Execute code in container
   - Stream stdout/stderr to frontend
   - Listen for stdin requests
   - Forward user input to container
   - Clean up container on completion

### Security Considerations

1. Code Sanitization
   - Remove potentially dangerous imports
   - Limit execution time
   - Prevent file system access outside designated areas

2. Resource Limitations
   - CPU usage limits
   - Memory limits
   - Network access restrictions
   - Maximum execution time

3. Rate Limiting
   - Limit requests per user/IP
   - Prevent DoS attacks

## Frontend Integration

### WebSocket Connection from Frontend

```typescript
// Example frontend integration
const socket = io('http://backend-url');

socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('output', (data) => {
  // Display output in terminal
  setTerminalOutput(prev => [...prev, data.output]);
});

socket.on('error', (data) => {
  // Display error in terminal
  setTerminalOutput(prev => [...prev, `Error: ${data.error}`]);
  setIsRunning(false);
});

socket.on('input_required', () => {
  // Show input field
  if (inputRef.current) {
    inputRef.current.focus();
  }
});

socket.on('execution_complete', () => {
  // Handle execution completion
  setTerminalOutput(prev => [...prev, '> Program completed.']);
  setIsRunning(false);
});

// Send code execution request
const runCode = async () => {
  setIsRunning(true);
  setIsTerminalMinimized(false);
  setTerminalOutput(prev => [...prev, '> Running code...']);
  
  // Send code to backend
  const response = await fetch('/api/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code,
      language: 'python',
    }),
  });
  
  const { sessionId } = await response.json();
  
  // Join session room
  socket.emit('join', { sessionId });
};

// Send user input to backend
const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && userInput) {
    const input = userInput;
    setUserInput('');
    
    // Echo input in terminal
    setTerminalOutput(prev => [...prev, input]);
    
    // Send input to backend
    socket.emit('input', { input });
  }
};
```

## Deployment Considerations

1. Docker-in-Docker Setup
   - For cloud environments where Docker is required inside a container

2. Scalability
   - Load balancing multiple instances
   - Container resource management

3. Monitoring
   - Track container creation/destruction
   - Monitor resource usage
   - Log execution errors

## Implementation Steps

1. Set up basic Express server with Socket.IO
2. Implement Docker container management
3. Create code execution service with I/O handling
4. Set up WebSocket event handlers
5. Implement security measures
6. Add API endpoints
7. Test with frontend integration
8. Deploy and scale

## Error Handling

1. Container Creation Failures
   - Report clear error message
   - Clean up partial resources

2. Execution Timeouts
   - Kill containers after maximum time limit
   - Report timeout to user

3. Runtime Errors
   - Stream Python errors to frontend
   - Distinguish between syntax errors and runtime errors

## Example Usage

When a user submits Python code:

1. Frontend posts code to `/api/execute`
2. Backend validates request and creates Docker container
3. Backend executes code and streams output via WebSocket
4. If code requires input, backend sends `input_required` event
5. Frontend displays input prompt and sends user input
6. When execution completes, backend sends `execution_complete` event
7. Container is cleaned up, resources are released
