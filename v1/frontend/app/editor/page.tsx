'use client';

import { useState, useRef, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { dracula } from '@uiw/codemirror-theme-dracula';
import io, { Socket } from 'socket.io-client';

interface ExecuteAcknowledgement {
  success: boolean;
  sessionId?: string;
  error?: string;
  message?: string;
}

export default function Editor() {
  const defaultCode = '# Write your Python code here\nprint("Hello, CodeX!")\n\n# Example: Input from user\nname = input("What is your name? ")\nprint(f"Hello, {name}!")';
  const [code, setCode] = useState(defaultCode);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isTerminalMinimized, setIsTerminalMinimized] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentInput, setCurrentInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  
  // Initialize socket connection
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const socketInstance = io(backendUrl);
    
    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server', socketInstance.id);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
    
    // This should show all socket events
    socketInstance.onAny((event, ...args) => {
      console.log(`Socket event: ${event}`, args);
    });

    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  // Set up socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Clear previous listeners
    socket.off('output');
    socket.off('error');
    socket.off('execution_complete');
    socket.off('input_required');
    socket.off('execution_started');
    socket.off('pong');

    // Handle output from code execution
    socket.on('output', (data) => {
      console.log('Received output event:', data);
      setTerminalOutput(prev => {
        const newOutput = [...prev, data.output];
        console.log('Updated terminal output:', newOutput);
        return newOutput; // Add this return statement!
      });
      // Auto-scroll terminal to bottom
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    });

    // Handle errors
    socket.on('error', (data) => {
      setTerminalOutput(prev => [...prev, `Error: ${data.error}`]);
      setIsRunning(false); // Stop execution state
    });

    // Handle execution completion
    socket.on('execution_complete', () => {
      setTerminalOutput(prev => [...prev, '> Program completed.']);
      setIsRunning(false);
    });

    // Handle input requests
    socket.on('input_required', () => {
      // Focus the terminal element when input is required
      if (terminalRef.current) {
        terminalRef.current.focus();
      }
    });

    // Handle pong response for socket testing
    socket.on('pong', () => {
      console.log('Received pong from server');
      setTerminalOutput(prev => [...prev, '> Socket connection is working!']);
    });

    // Cleanup on unmount
    return () => {
      socket.off('output');
      socket.off('error');
      socket.off('execution_complete');
      socket.off('input_required');
      socket.off('execution_started');
      socket.off('pong');
    };
  }, [socket]);
  
  // Handle code execution - send to backend via WebSocket
  const runCode = async () => {
    if (!socket) {
      setTerminalOutput(prev => [...prev, 'Error: WebSocket connection not established']);
      return;
    }
    
    setIsRunning(true);
    setIsTerminalMinimized(false); // Auto-expand terminal when running code
    setTerminalOutput(prev => [...prev, '> Running code...']);
    
    try {
      // Send code to backend via WebSocket
      socket.emit('execute', {
        code,
        language: 'python'
      }, (acknowledgement: ExecuteAcknowledgement) => {
        console.log('Execute acknowledgement:', acknowledgement);
        
        // Optionally handle the acknowledgement
        if (acknowledgement.success && acknowledgement.sessionId) {
          setSessionId(acknowledgement.sessionId);
          // Explicitly join the session room
          socket.emit('join_session', { sessionId: acknowledgement.sessionId });
        } else if (!acknowledgement.success && acknowledgement.error) {
          setTerminalOutput(prev => [...prev, `Error: ${acknowledgement.error}`]);
          setIsRunning(false);
        }
      });
    } catch (error) {
      setTerminalOutput(prev => [...prev, `Error: ${error instanceof Error ? error.message : String(error)}`]);
      setIsRunning(false);
    }
  };
  
  // Handle key press in terminal
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isRunning) return;
    
    // Prevent default for most keys to avoid scrolling, etc.
    if (e.key !== 'Tab') {
      e.preventDefault();
    }

    if (e.key === 'Enter') {
      // Submit input when Enter is pressed
      if (currentInput.trim() !== '') {
        handleSubmitInput(currentInput);
        setCurrentInput('');
      }
    } else if (e.key === 'Backspace') {
      // Handle backspace
      setCurrentInput(prev => prev.slice(0, -1));
    } else if (e.key.length === 1) {
      // Add printable characters to input
      setCurrentInput(prev => prev + e.key);
    }
  };

  // Handle input submission
  const handleSubmitInput = (input: string) => {
    if (!socket || !sessionId) return;

    console.log(`Submitting input: "${input}" for session ${sessionId}`);

    // Show input in terminal
    setTerminalOutput(prev => [...prev, `> ${input}`]);
    
    // Send input to backend
    socket.emit('input', { 
      sessionId,
      input 
    });
  };

  // Focus terminal when clicking on it
  const focusTerminal = () => {
    if (terminalRef.current) {
      terminalRef.current.focus();
    }
  };

  const toggleTerminal = () => {
    setIsTerminalMinimized(!isTerminalMinimized);
  };
  
  // Clear terminal output
  const clearTerminal = () => {
    setTerminalOutput([]);
  };
  
  // Clear editor content
  const clearEditor = () => {
    setCode('');
  };
  
  // Reset editor to default template
  const resetEditor = () => {
    setCode(defaultCode);
  };

  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-4 gap-4 font-[family-name:var(--font-geist-sans)]">
      <header className="flex items-center justify-between w-full">
        <h1 className="text-3xl font-bold">CodeX Editor</h1>
        <div className="flex space-x-2">
          <button 
            onClick={clearEditor}
            className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            title="Clear all code"
          >
            Clear Editor
          </button>
          <button 
            onClick={resetEditor}
            className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            title="Reset to default template"
          >
            Reset
          </button>
          <button 
            onClick={runCode}
            disabled={isRunning}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          <button 
            onClick={() => {
              if (socket) {
                console.log('Testing socket connection');
                socket.emit('ping');
              } else {
                console.log('Socket not connected');
              }
            }}
            className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            title="Test socket connection"
          >
            Test Socket
          </button>
        </div>
      </header>
      
      <main className="grid grid-rows-[1fr_auto] gap-4 h-full">
        {/* Code Editor */}
        <div className="border border-gray-300 rounded overflow-hidden">
          <CodeMirror
            value={code}
            height="100%"
            theme={dracula}
            extensions={[python()]}
            onChange={(value) => setCode(value)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              history: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              searchKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
        </div>
        
        {/* Terminal with integrated input */}
        <div className={`transition-all duration-300 border border-gray-700 rounded bg-black text-green-400 font-mono overflow-hidden ${isTerminalMinimized ? 'h-10' : 'h-[250px]'}`}>
          <div className="flex justify-between items-center px-2 py-1 bg-gray-800 border-b border-gray-700">
            <span className="text-sm font-semibold">Terminal</span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={clearTerminal}
                className="px-2 py-1 text-xs rounded hover:bg-gray-700 focus:outline-none" 
                aria-label="Clear terminal"
                title="Clear terminal output"
              >
                Clear
              </button>
              <button 
                onClick={toggleTerminal} 
                className="px-2 py-1 text-xs rounded hover:bg-gray-700 focus:outline-none" 
                aria-label={isTerminalMinimized ? "Expand terminal" : "Minimize terminal"}
              >
                {isTerminalMinimized ? '▲ Expand' : '▼ Minimize'}
              </button>
            </div>
          </div>
          
          {!isTerminalMinimized && (
            <div 
              ref={terminalRef}
              className="h-full p-2 overflow-auto outline-none"
              tabIndex={0}
              onClick={focusTerminal}
              onKeyDown={handleKeyDown}
            >
              {terminalOutput.map((line, i) => (
                <div key={i} className="whitespace-pre-wrap">{line}</div>
              ))}
              {/* Integrated input line with blinking cursor */}
              {isRunning && (
                <div className="flex whitespace-pre-wrap">
                  <span>{'> '}</span>
                  <span>{currentInput}</span>
                  <span className="animate-pulse ml-0.5">▌</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      <footer className="text-center text-gray-500 text-sm">
        CodeX - An online code editor for young programmers
      </footer>
    </div>
  );
}