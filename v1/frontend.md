# CodeX Frontend Documentation

## Overview
CodeX is an online code editor designed for young programmers to write, run, and interact with Python code in a web-based environment. The frontend is built using React with Next.js and uses CodeMirror for code editing capabilities.

## Frontend Architecture

### Core Components
1. **Code Editor**: Implemented using CodeMirror with Python syntax highlighting and the Dracula theme
2. **Terminal**: Custom-built terminal interface for displaying code execution output and accepting user input
3. **Controls**: Buttons for code execution, clearing/resetting editor, and managing the terminal

### State Management
The application uses React's useState for managing various states:

```typescript
const [code, setCode] = useState(defaultCode);           // Stores current code in editor
const [terminalOutput, setTerminalOutput] = useState<string[]>([]); // Terminal output lines
const [isRunning, setIsRunning] = useState(false);       // Code execution status
const [userInput, setUserInput] = useState('');          // Current user input in terminal
const [isTerminalMinimized, setIsTerminalMinimized] = useState(false); // Terminal visibility
```

## User Interactions

### Code Editing
- Users can write Python code in the editor
- Syntax highlighting, line numbers, and code completion are provided
- Default template code is provided for new users

### Code Execution
- When the user clicks "Run Code", the `runCode()` function is called
- Terminal is expanded (if minimized) and shows "Running code..." message
- Currently execution is simulated with setTimeout, but should connect to backend

### Terminal Interaction
- Terminal displays output from code execution
- When code requires input, a text field appears for user input
- User can press Enter to submit input which is processed and displayed
- Terminal can be minimized/expanded and cleared

### Additional Controls
- Clear Editor: Empties the code editor
- Reset: Resets editor to default template
- Clear Terminal: Clears all terminal output

## Backend Requirements

### API Endpoints Needed

#### 1. Execute Code Endpoint
- **Purpose**: Run Python code and handle input/output interaction
- **Method**: POST
- **URL**: `/api/execute` (suggested)
- **Request Body**:
  ```json
  {
    "code": "# Python code as string",
    "language": "python"
  }
  ```
- **Response**: 
  - Initial acknowledgment with session ID for continued communication

#### 2. Stream Output (WebSocket recommended)
- **Purpose**: Real-time streaming of code execution output
- **Events to handle**:
  - `output`: Standard output from program
  - `error`: Error output from program
  - `input_required`: Signal that program is waiting for input
  - `execution_complete`: Signal that execution has finished

#### 3. Provide Input (WebSocket)
- **Purpose**: Send user input to running program
- **Event/Message format**:
  ```json
  {
    "sessionId": "unique-execution-id",
    "input": "user input string"
  }
  ```

### Backend Implementation Notes

1. **Docker Execution Environment**:
   - Each code execution should run in an isolated Docker container
   - Python 3 image recommended with necessary libraries
   - Set resource limits to prevent abuse (CPU, memory, execution time)

2. **Input/Output Handling**:
   - Need to capture stdout, stderr in real-time
   - Need to feed stdin when program requests input
   - Must correctly handle program completion and errors

3. **WebSocket Communication**:
   - Required for real-time interaction between frontend terminal and backend execution
   - Should maintain connection for duration of code execution

4. **Security Considerations**:
   - Sanitize code input to prevent injection attacks
   - Limit execution time and resources
   - Isolate each execution to prevent cross-user interference
   - Consider rate limiting to prevent abuse

## Frontend Integration Points

### Code Execution Flow

```javascript
// This is where backend integration should happen
const runCode = async () => {
  setIsRunning(true);
  setIsTerminalMinimized(false);
  setTerminalOutput(prev => [...prev, '> Running code...']);
  
  try {
    // Replace simulation with actual backend call:
    // 1. Establish WebSocket connection
    // 2. Send code to backend via API
    // 3. Listen for output/input events on WebSocket
    
    // Current simulation:
    setTimeout(() => {
      setTerminalOutput(prev => [...prev, '> What is your name? ']);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 1000);
  } catch (error) {
    setTerminalOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`]);
    setIsRunning(false);
  }
};
```

### User Input Handling

```javascript
// This function should send input to backend via WebSocket
const handleInputSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter' && userInput) {
    const input = userInput;
    setUserInput('');
    
    // Send input to backend via WebSocket
    // websocket.send({ type: 'input', data: input });
    
    // Update terminal with input (echo)
    setTerminalOutput(prev => [...prev, input]);
    
    // Current simulation:
    setTerminalOutput(prev => [...prev, `Hello, ${input}!`, '> Program completed.']);
    setIsRunning(false);
  }
};
```

## Recommended Backend Technologies

1. **Node.js with Express**: For REST API endpoints
2. **Socket.IO or ws**: For WebSocket communication
3. **Docker**: For isolated code execution
4. **Node.js child_process or docker-exec**: For running Python processes

## Example Backend Workflow

1. Receive code execution request from frontend
2. Create isolated Docker container with Python
3. Start code execution in container
4. Stream stdout/stderr to frontend via WebSocket
5. When stdin is required, send `input_required` event to frontend
6. Receive input from frontend and feed to running process
7. On completion or error, send appropriate event and clean up container