Product Requirements Document (PRD)
Product Name: CodeX – Online Coding Editor with Terminal
Target User: Young coders and students learning to code
Goal: Enable users to write, run, and interact with code (input/output) in a web-based environment, with a focus on simplicity and real-time feedback.

1. Problem Statement
Young coders need a simple, accessible, and interactive environment to write code, provide input, and see output instantly, without complex setup or installation.

2. Objectives
Provide a web-based code editor with syntax highlighting.
Allow users to run code and interact with input/output in a single terminal window.
Support at least Python (optionally, extend to other languages).
Host the solution and provide a public URL for access and evaluation.
3. Features
3.1 Core Features (MVP)
Code Editor:

Syntax highlighting (using Monaco or CodeMirror).
Language selection (start with Python).
Editable code area with basic features (copy, paste, undo, redo).
Terminal/Console:

Integrated terminal pane below or beside the editor.
Displays program output (stdout, stderr).
Accepts user input (stdin) during program execution.
All I/O in the same window.
Run Button:

Executes the code in a secure backend environment.
Sends code and user input to backend for execution.
Displays output in real-time in the terminal pane.
Backend Execution:

Runs code in a Docker container for isolation and security.
Handles input/output streaming between frontend and backend.
Enforces resource/time limits to prevent abuse.
Hosting:

Fully hosted, accessible via a public URL.
No code samples or local-only solutions accepted.
3.2 Good-to-Have Features
Session Persistence:
Save code and terminal state per user session (localStorage or backend).
Multiple Language Support:
Add support for JavaScript, C/C++, etc.
Error Handling:
Display clear error messages for code errors, timeouts, or backend issues.
3.3 Great-to-Have Features
GUI Output Support:
Render graphical output (e.g., charts, HTML) in a separate pane.
AI Assistance:
Code suggestions, error explanations, or hints using AI tools.
Theming:
Light/dark mode, font size adjustment.
Collaboration:
Real-time code sharing or pair programming.
4. User Stories
As a young coder, I want to write code in my browser so I can learn and experiment easily.
As a user, I want to provide input to my program and see the output in the same terminal window.
As a user, I want to see syntax highlighting and basic editor features to help me write code.
As a user, I want to run my code and see results instantly, including errors and print statements.
5. Technical Requirements
Frontend:

React (or similar) SPA.
Monaco Editor or CodeMirror for code editing.
Terminal component for I/O (xterm.js or custom).
Backend:

Node.js/Express server.
Docker for code execution (python:3 image).
WebSocket or HTTP for real-time I/O streaming.
Security:

Each code run in a fresh, isolated Docker container.
Resource limits (CPU, memory, execution time).
No persistent storage in containers.
Deployment:

Frontend: Vercel/Netlify.
Backend: Heroku/Render/Fly.io.
Docker host: Managed or self-hosted with public IP.
6. Evaluation Criteria
Acceptable:
Input/Output works (user can provide input, see output).
Good:
Input/Output works in the same terminal window.
Great:
Input with text and GUI output works.
7. Milestones & Timeline (1 Day Plan)
Setup & Boilerplate (1h):

Project structure, repo, CI/CD.
Frontend Editor & Terminal (2h):

Monaco/CodeMirror integration, terminal UI.
Backend Docker Runner (2h):

Express server, Docker code execution, I/O piping.
Frontend-Backend Integration (1.5h):

API wiring, real-time I/O.
Testing & Polish (1h):

Manual tests, error handling, UI tweaks.
Deployment (0.5h):

Deploy, test public URL.
8. Success Metrics
Hosted URL is live and accessible.
User can write code, provide input, and see output in the same terminal window.
No security or stability issues during evaluation.
