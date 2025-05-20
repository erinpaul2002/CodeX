# CodeX - Interactive Python Code Editor for Young Programmers

## Project Overview

CodeX is an online Python code editor designed specifically for young programmers and students learning to code. It provides an intuitive web-based environment for writing, running, and interacting with Python code in real-time, eliminating the need for complex local development setups.

![CodeX Landing Page](reference/CodeX-LandingPage.png)

## Key Features

- **Interactive Code Editor**: Syntax highlighting, line numbers, and code completion
- **Real-time Code Execution**: Run Python code directly in the browser
- **Interactive Terminal**: Input and output in the same terminal window
- **Docker Isolation**: Secure execution environment for user code
- **WebSocket Communication**: Real-time streaming of program output
- **Beginner-Friendly UI**: Simple, clean interface designed for young coders

## System Architecture

### Frontend 

The frontend is built with React and Next.js, offering a responsive and intuitive user interface.

#### Core Components

1. **Code Editor**: Implemented with CodeMirror, featuring Python syntax highlighting and the Dracula theme for better readability
2. **Terminal**: Custom-built interface for displaying program output and accepting user input
3. **Control Panel**: Buttons for executing code, clearing/resetting the editor, and managing the terminal

#### State Management

```typescript
const [code, setCode] = useState(defaultCode);           // Current code in editor
const [terminalOutput, setTerminalOutput] = useState<string[]>([]); // Terminal output
const [isRunning, setIsRunning] = useState(false);       // Execution status
const [userInput, setUserInput] = useState('');          // User input in terminal
const [isTerminalMinimized, setIsTerminalMinimized] = useState(false); // Terminal visibility
const [socket, setSocket] = useState<Socket | null>(null); // WebSocket connection
const [sessionId, setSessionId] = useState<string | null>(null); // Execution session ID
```

### Backend

The backend is a Node.js Express server that handles code execution in isolated Docker containers and streams the output back to the frontend.

#### Core Components

1. **Express Server**: Handles HTTP requests and API endpoints
2. **Socket.IO Server**: Manages real-time WebSocket communication
3. **Docker Container Manager**: Creates, manages, and destroys isolated execution environments
4. **Code Execution Service**: Orchestrates the execution workflow
5. **Security Layer**: Implements rate limiting, resource constraints, and code sanitization

#### Execution Flow

1. Frontend submits code to backend via API or WebSocket
2. Backend validates the code and generates a unique session ID
3. Backend creates an isolated Docker container and writes the code to a file
4. Code is executed in the container with resource limitations
5. Output is streamed back to the frontend in real-time
6. User input is captured and sent to the container when required
7. Upon completion or error, the container is cleaned up and resources are released

## Technical Implementation

### Docker Isolation

Each code execution takes place in an isolated Docker container with:

- Memory limits (100MB)
- CPU limits (1 core)
- Network access disabled
- Read-only filesystem
- Process limits
- Execution timeouts (30 seconds)

```typescript
// Container creation with resource limits
const container = await this.docker.createContainer({
  Image: this.pythonImage,
  AttachStdin: true,
  AttachStdout: true,
  AttachStderr: true,
  OpenStdin: true,
  StdinOnce: false,
  Tty: false,
  Cmd: ['python', `/app/${fileName}`],
  HostConfig: {
    Binds: [`${filePath}:/app/${fileName}`],
    Memory: 100 * 1024 * 1024, // 100 MB memory limit
    MemorySwap: 100 * 1024 * 1024, // Disable swap
    NanoCpus: 1 * 1000000000, // 1 CPU core
    NetworkMode: 'none', // Disable network access
    PidsLimit: 100, // Limit number of processes
    ReadonlyRootfs: true, // Make root filesystem read-only
  },
});
```

### Real-time Communication

Socket.IO is used for real-time communication between frontend and backend:

- **Events from backend to frontend**:
  - `output`: Program output
  - `error`: Error messages
  - `input_required`: Signal that program is waiting for input
  - `execution_complete`: Signal execution completion

- **Events from frontend to backend**:
  - `execute`: Send code for execution
  - `input`: Send user input to running program
  - `join`: Join a specific execution session

### Input/Output Handling

Special attention is given to detecting when programs are waiting for user input:

```typescript
// Check if program is waiting for input
if (output.endsWith(': ') || output.endsWith('? ') || output.endsWith('input()')) {
  session.isWaitingForInput = true;
  this.emitToSocket(sessionId, 'input_required');
}
```

## Security Considerations

1. **Isolated Execution**: Each code snippet runs in its own Docker container
2. **Resource Limitations**: Prevents resource abuse and DoS attacks
3. **Network Isolation**: Containers have no network access
4. **Rate Limiting**: Prevents abuse of the service
5. **Input Validation**: All user inputs are validated before processing
6. **Execution Timeouts**: Maximum execution time to prevent infinite loops

## Deployment Guide

### Prerequisites

- Node.js 14+ and npm
- Docker Engine
- Git

### Local Development Setup

1. **Clone the repository**:
   ```powershell
   git clone https://github.com/your-username/codex.git
   cd codex
   ```

2. **Backend Setup**:
   ```powershell
   cd backend
   npm install
   npm run build
   npm start
   ```

3. **Frontend Setup**:
   ```powershell
   cd frontend
   npm install
   # Create .env.local file
   "NEXT_PUBLIC_API_URL=http://localhost:4000" | Out-File -FilePath .env.local -Encoding utf8
   npm run dev
   ```

### Docker Deployment

Using docker-compose for complete system deployment:

```powershell
docker-compose up -d
```

### Cloud Deployment

1. **Backend Deployment**:
   - Deploy to a cloud provider that supports Docker
   - Ensure the Docker socket is accessible
   - Set appropriate environment variables

2. **Frontend Deployment**:
   - Deploy to Vercel, Netlify, or similar
   - Configure environment variables to point to the backend URL

## Future Enhancements

### Educational Features

1. **Code Templates Library**: Pre-made examples for common programming tasks
2. **Interactive Tutorials**: Step-by-step guides for learning Python concepts
3. **Simplified Error Messages**: Kid-friendly explanations of Python errors
4. **Code Challenges**: Built-in programming challenges with difficulty levels
5. **Visual Output Support**: Display simple graphics or charts

### Technical Improvements

1. **User Authentication**: Save code snippets and track learning progress
2. **Additional Language Support**: Add JavaScript, Ruby, etc.
3. **Code Sharing**: Generate shareable links for code snippets
4. **Collaborative Editing**: Real-time pair programming for mentoring
5. **AI-Powered Hints**: Intelligent suggestions for fixing errors or improving code

## Project Structure

```
/codex
├── backend/                   # Backend Node.js application
│   ├── src/
│   │   ├── index.ts           # Entry point
│   │   ├── controllers/       # API controllers
│   │   │   └── execute.controller.ts
│   │   └── services/          # Business logic
│   │       ├── docker.service.ts
│   │       ├── execution.service.ts
│   │       └── socket.service.ts
│   ├── Dockerfile             # Backend container definition
│   └── package.json           # Backend dependencies
├── frontend/                  # Frontend Next.js application
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # App layout
│   │   └── editor/            # Code editor
│   │       └── page.tsx       # Editor implementation
│   ├── package.json           # Frontend dependencies
│   └── .env.local             # Environment variables
├── docker-compose.yml         # Multi-container deployment
└── documentation/
    ├── backend.md             # Backend documentation
    └── frontend.md            # Frontend documentation
```

## Conclusion

CodeX provides a complete solution for young coders to learn Python programming in a safe, interactive web environment. By removing the barriers of complex setup and configuration, it enables students to focus on learning the fundamentals of programming through hands-on practice.

The combination of a user-friendly interface, real-time code execution, and interactive input/output capabilities creates an engaging learning experience. The Docker-based isolation ensures security while still providing a full-featured Python environment.

The system architecture is designed for scalability and maintainability, with clear separation of concerns between frontend and backend components, making it easy to extend with additional features in the future.

---

*CodeX - Empowering young minds to code*
