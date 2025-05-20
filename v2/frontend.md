# CodeX Student IDE: Frontend Documentation

## Overview

CodeX is a lightweight, browser-based coding environment designed to provide an accessible coding experience for students and learners. This document outlines the frontend implementation of the CodeX IDE, which features a Monaco-based code editor and an integrated xterm.js terminal for executing and interacting with code.

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Next.js 14+ with TypeScript |
| **Code Editor** | Monaco Editor (@monaco-editor/react) |
| **Terminal** | xterm.js with xterm-addon-fit |
| **Styling** | Tailwind CSS with CSS Modules |
| **Client Routing** | Next.js App Router |
| **HTTP Client** | Native fetch API |
| **State Management** | React Hooks (useState, useEffect, useRef) |

## Architecture

The frontend follows a component-based architecture built on Next.js's App Router pattern:

```
/frontend
├── app/                  # Next.js App structure
│   ├── api/              # API routes
│   │   ├── exec/         # WebSocket endpoint for interactive sessions
│   │   └── run/          # HTTP endpoint for code execution
│   ├── editor/           # Editor workspace page
│   ├── page.tsx          # Landing page
│   └── layout.tsx        # Root layout
├── components/           # Reusable UI components
│   ├── CodeEditor.tsx    # Demo editor for landing page
│   ├── Editor.tsx        # Monaco editor wrapper
│   ├── Hero.tsx          # Landing page hero section
│   ├── Navbar.tsx        # Navigation component
│   └── Terminal.tsx      # xterm.js terminal wrapper
├── styles/               # CSS Modules for component styling
└── lib/                  # Utility functions
```

## Key Components

### Landing Page (`app/page.tsx`)

The landing page serves as an entry point with:
- A hero section with a call-to-action
- A preview of the code editor to showcase functionality
- Navigation to the full editor workspace

### Editor Workspace (`app/editor/page.tsx`)

The main IDE interface combining:
- A Monaco-based code editor with syntax highlighting and language support
- An integrated terminal for output display
- Language selection dropdown
- Controls for code execution

### Monaco Editor Integration (`components/Editor.tsx`)

Wraps the Monaco editor with:
- Language-specific configuration
- Syntax highlighting and IntelliSense
- Custom themes and styling
- Language template suggestions

```tsx
// Key configuration options
options={{
  minimap: { enabled: true, scale: 0.75 },
  fontSize: 14,
  fontFamily: "'Fira Code', 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
  fontLigatures: true,
  automaticLayout: true,
  scrollBeyondLastLine: false,
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: 'active', indentation: true }
}}
```

### Terminal Integration (`components/Terminal.tsx`)

Implements xterm.js with:
- Auto-fitting capability to adjust to container size
- Input/output handling
- Custom styling for a modern terminal look

## API Integration

### Code Execution

The editor currently has two API routes for code execution:

1. **HTTP-based Execution** (`/api/run`):
   - Takes code, language, and optional stdin
   - Returns stdout, stderr, and exit code
   - Used for simple, non-interactive programs

2. **WebSocket-based Execution** (`/api/exec`):
   - Establishes bidirectional communication
   - Handles interactive programs that require ongoing stdin/stdout
   - Proxies communication with the Piston execution engine

## State Management

State is managed within the editor page using React hooks:

```tsx
// Core state variables
const [code, setCode] = useState('// Write your code here\nconsole.log("Hello, world!");');
const [language, setLanguage] = useState('python');
```

The component handles:
- Code content updates
- Language selection
- Terminal I/O
- Execution state

## Styling

The UI combines:
- Tailwind CSS for utility-based styling
- CSS Modules for component-specific styling
- Custom gradients and animations for a modern look
- Responsive design considerations

Example styling from the editor:
```css
.editorContainer {
  border-radius: 0.5rem;
  overflow: hidden;
  background-color: #1e1e1e;
  border: 1px solid rgba(99, 102, 241, 0.2);
}
```

## End-to-End Flow

The typical user flow through the application:

1. User lands on the homepage and clicks "Get Started"
2. User is taken to the editor workspace 
3. User selects a programming language and writes code
4. User clicks "Run" which:
   - Sends code to the `/api/run` endpoint
   - Displays the output in the terminal
5. For interactive programs, a WebSocket connection to `/api/exec` handles ongoing I/O

## Current Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | ✅ Complete | Modern design with preview |
| Editor UI | ✅ Complete | Monaco integration with styling |
| Terminal UI | ✅ Complete | xterm.js integration with styling |
| Navigation | ✅ Complete | Between landing and editor pages |
| Language Support | ⚠️ Partial | Basic support implemented |
| Code Execution (HTTP) | ⚠️ Partial | API route structure exists but using simulation |
| Interactive Execution (WS) | ❌ Pending | WebSocket endpoint not fully implemented |
| Piston Integration | ❌ Pending | API routes need to connect to Piston |

## Next Steps

1. **Complete Language Templates**:
   - Implement missing language templates in the Editor component
   - Add syntax highlighting for all supported languages

2. **Connect to Piston**:
   - Implement the HTTP-based code execution in `/api/run/route.ts`
   - Complete the WebSocket implementation in `/api/exec/route.ts`

3. **UI Enhancements**:
   - Add loading states during code execution
   - Implement proper error handling
   - Add notifications for execution results

4. **User Features**:
   - Code saving functionality
   - Sharing capability
   - User preferences for editor settings

## Conclusion

The CodeX IDE frontend provides a modern, user-friendly interface for coding and learning. The implementation follows best practices in React and Next.js development, with a focus on performance and user experience. The modular architecture allows for easy extension and maintenance as the project grows.
