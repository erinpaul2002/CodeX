'use client';

import dynamic from 'next/dynamic';
import { useRef, useState, useEffect } from 'react';
import { Editor } from '@/components/Editor';
import terminalStyles from '@/styles/Terminal.module.css';
import editorStyles from '@/styles/Editor.module.css';

// Define proper types for terminal interfaces
interface TerminalInstance {
  write: (data: string) => void;
}

interface TerminalRef {
  fit: () => void;
}

// Dynamic import with type annotation
const TerminalPane = dynamic(
  () => import('@/components/Terminal').then(mod => ({ default: mod.TerminalPane })),
  { ssr: false, loading: () => <div className="w-full h-full bg-black flex items-center justify-center text-gray-500">Loading terminal...</div> }
);

export default function EditorPage() {
  const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, world!");');
  const [language, setLanguage] = useState('python');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const terminalRef = useRef<TerminalInstance>(null);
  const terminalComponentRef = useRef<TerminalRef>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pistonApiUrl, setPistonApiUrl] = useState('');

  // Initialize Piston API URL
  useEffect(() => {
    setPistonApiUrl(process.env.NEXT_PUBLIC_PISTON_API_URL || 'http://localhost:2000/api/v2');
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Function to execute code directly using Piston API
  const runCode = async () => {
    if (!terminalRef.current) return;
    
    // Clear terminal and show running message
    terminalRef.current.write('\x1bc'); // Clear terminal
    terminalRef.current.write(`🚀 Running ${language.toUpperCase()} code...\r\n\n`);
    
    setIsRunning(true);
    
    try {
      // Use the pistonApiUrl variable for logging/debugging
      console.log(`Using Piston API URL: ${pistonApiUrl}`);
      
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language,
          code,
          stdin: '',
          args: [],
          timeout: {
            compile: 10000,
            run: 3000
          }
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Unknown error');
      }
      
      // Display execution results in terminal
      if (result.stdout) {
        terminalRef.current.write(`${result.stdout}`);
      }
      
      if (result.stderr) {
        terminalRef.current.write(`\r\n\x1b[31m${result.stderr}\x1b[0m`); // Red color for errors
      }
      
      // Show execution summary
      terminalRef.current.write(`\r\n\n\x1b[36m✓ Execution completed with exit code ${result.exitCode} (${result.executionTime}ms)\x1b[0m\r\n`);
    } catch (error) {
      console.error('Failed to execute code:', error);
      terminalRef.current.write(`\r\n\x1b[31mError: ${error instanceof Error ? error.message : 'Failed to connect to execution service. Please try again later.'}\x1b[0m\r\n`);
    } finally {
      setIsRunning(false);
      // Show prompt again
      terminalRef.current.write('\r\n> ');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-gray-950 to-slate-900 text-white overflow-hidden">
      {/* HEADER */}
      <header className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">CodeX</span>
          <span className="text-lg font-mono text-indigo-200 animate-pulse-glow">Student IDE</span>
        </div>
      </header>

      {/* MAIN EDITOR/TERMINAL AREA */}
      <div className="flex-1 flex flex-col items-center overflow-hidden">
        <div className="w-[90vw] max-w-6xl h-full flex flex-col pb-6">
          {/* EDITOR PANEL */}
          <div className={`${editorStyles.editorContainer} shadow-xl flex flex-col h-[60%] min-h-0`}>
            <div className="panel-header flex items-center">
              <div className={terminalStyles.windowControls}>
                <div className={`${terminalStyles.windowDot} ${terminalStyles.red}`}></div>
                <div className={`${terminalStyles.windowDot} ${terminalStyles.yellow}`}></div>
                <div className={`${terminalStyles.windowDot} ${terminalStyles.green}`}></div>
              </div>
              <span className={terminalStyles.headerEmoji}>💡</span>
              <span>Editor</span>
              
              {/* Only language dropdown in the editor panel header now */}
              <div className="ml-auto flex items-center"> 
                <div className="relative" ref={dropdownRef}>
                  <div 
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="text-xs font-mono bg-indigo-700/30 px-2 py-0.5 rounded">
                      {language.toUpperCase()}
                    </span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-3 w-3 text-indigo-300" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute left-1/2 -translate-x-1/2 mt-1 w-36 py-1 bg-gray-800/90 backdrop-blur-md border border-indigo-800/30 rounded-md shadow-lg z-50">
                      {['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'ruby', 'php'].map((lang) => (
                        <div
                          key={lang}
                          className={`px-3 py-1 text-xs font-mono cursor-pointer hover:bg-indigo-700/40 ${language === lang ? 'bg-indigo-700/30 text-indigo-200' : 'text-gray-200'}`}
                          onClick={() => {
                            setLanguage(lang);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {lang.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Editor content */}
            <div className="flex-1 overflow-hidden">
              <Editor
                value={code}
                onChange={value => setCode(value ?? '')}
                language={language}
              />
            </div>
          </div>

          {/* SEPARATOR */}
          <div className="h-[1px] bg-indigo-900/30 my-0.5 flex-shrink-0"></div>

          {/* TERMINAL PANEL */}
          <div className={`${terminalStyles.terminalContainer} shadow-xl flex flex-col h-[calc(40%-5px)] min-h-0`}>
            <div className={terminalStyles.terminalHeader}>
              <span className={terminalStyles.headerEmoji}>🖥️</span>
              <span>Terminal</span>
              
              {/* UPDATED RUN BUTTON */}
              <button
                className={`ml-auto btn-glow flex items-center gap-1 py-0.5 px-3 text-sm ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={runCode}
                disabled={isRunning}
              >
                <span>{isRunning ? '⏳' : '🚀'}</span>{isRunning ? 'Running...' : 'Run'}
              </button>
            </div>
            
            {/* Terminal content */}
            <div className="flex-1 overflow-hidden">
              <TerminalPane
                ref={terminalComponentRef}
                onData={(data) => {
                  console.log('Terminal input:', data);
                }}
                write={(term) => {
                  if (!terminalRef.current) {
                    terminalRef.current = term;
                    term.write(`Terminal Ready (${language}) - Type commands here\r\n> `);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
