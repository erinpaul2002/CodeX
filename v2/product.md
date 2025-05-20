```markdown
# DevLaunch Mini‑IDE: Technical Implementation Guide

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Tech Stack](#tech-stack)  
3. [Repository Structure](#repository-structure)  
4. [Frontend Implementation](#frontend-implementation)  
   - [1. Setup & Configuration](#1-setup--configuration)  
   - [2. Page & Component Structure](#2-page--component-structure)  
   - [3. Editor Integration (Monaco)](#3-editor-integration-monaco)  
   - [4. Terminal Integration (xterm.js)](#4-terminal-integration-xtermjs)  
   - [5. State & Data Flow](#5-state--data-flow)  
   - [6. Styling & Layout](#6-styling--layout)  
   - [7. Deployment (Vercel)](#7-deployment-vercel)  
5. [Backend Implementation](#backend-implementation)  
   - [1. Setup & Configuration](#1-setup--configuration-1)  
   - [2. API Routes](#2-api-routes)  
     - [`/api/run` (HTTP)](#apirun-http)  
     - [`/api/exec` (WebSocket)](#apiexec-websocket)  
   - [3. Piston Integration](#3-piston-integration)  
   - [4. Environment & Secrets](#4-environment--secrets)  
   - [5. Docker (Piston Engine)](#5-docker-piston-engine)  
   - [6. Deployment Options](#6-deployment-options)  
6. [End‑to‑End Flow](#end-to-end-flow)  
7. [Further Extensions](#further-extensions)  

---

## Project Overview

DevLaunch is a lightweight, hosted mini‑IDE that provides:

- A **code editor** pane (Monaco) with syntax highlighting and IntelliSense.  
- An **integrated terminal** pane (xterm.js) supporting both stdout and stdin.  
- **Run-on-demand** via HTTP (`/api/run`) and **interactive** sessions via WebSocket (`/api/exec`).  
- Single Next.js project co‑hosting frontend and backend API routes.  
- A Dockerized Piston engine for sandboxed multi‑language code execution.

---

## Tech Stack

| Layer                   | Technology                       |
|-------------------------|----------------------------------|
| **Framework**           | Next.js (v14+) + TypeScript      |
| **Editor**              | `@monaco-editor/react`           |
| **Terminal**            | `xterm` + `xterm-addon-fit`      |
| **Styling**             | Tailwind CSS                     |
| **HTTP Client**         | `fetch` (native)                 |
| **WebSocket**           | Next.js API WebSocket handler    |
| **Execution Engine**    | Piston (Docker container)        |
| **Container Orchestration** | Docker Compose               |
| **Hosting (Frontend/ API)** | Vercel                     |
| **Hosting (Piston Engine)** | Any Docker‑capable host    |

---

## Repository Structure

```

/
├── app/                  # Next.js App or pages/ if using pages-router
│   ├── api/
│   │   ├── run.ts        # HTTP run endpoint
│   │   └── exec.ts       # WebSocket exec endpoint
│   ├── editor/
│   │   └── page.tsx      # Editor + terminal workspace
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Shared layout (imports global CSS)
│   └── globals.css       # Tailwind import & global styles
├── components/           # (optional) Shared UI components
│   ├── Editor.tsx        # Wraps MonacoEditor
│   └── Terminal.tsx      # Wraps xterm.js setup
├── public/               # Static assets
├── docker-compose.yml    # Piston engine service
├── next.config.js        # Next.js config (CORS, env, etc.)
├── tailwind.config.js    # Tailwind setup
├── tsconfig.json         # TypeScript settings
└── package.json

````

---

## Frontend Implementation

### 1. Setup & Configuration

1. **Initialize**  
   ```bash
   npx create-next-app@latest devlaunch --typescript
   cd devlaunch
   npm install @monaco-editor/react xterm xterm-addon-fit tailwindcss postcss autoprefixer
   npx tailwindcss init -p
````

2. **Tailwind**

   ```js
   // tailwind.config.js
   module.exports = {
     content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
     theme: { extend: {} },
     plugins: [],
   };
   ```

   ```css
   /* globals.css */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### 2. Page & Component Structure

* **Landing Page**: `app/page.tsx`
* **Editor Workspace**: `app/editor/page.tsx`
* **Shared Layout**: `app/layout.tsx` (imports globals.css)
* **Optional Components**: `components/Editor.tsx`, `components/Terminal.tsx`

### 3. Editor Integration (Monaco)

```tsx
// components/Editor.tsx
'use client';
import { Monaco } from '@monaco-editor/react';
import React from 'react';

export function Editor({ value, onChange, language }) {
  return (
    <Monaco
      height="100%"
      defaultLanguage={language}
      value={value}
      onChange={onChange}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        automaticLayout: true,
      }}
    />
  );
}
```

* Wrap `@monaco-editor/react` in a client component.
* Pass `value`, `onChange`, and `language` props.

### 4. Terminal Integration (xterm.js)

```tsx
// components/Terminal.tsx
'use client';
import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export function TerminalPane({ onData, write }) {
  const containerRef = useRef(null);
  const termRef = useRef<Terminal>();
  const fitRef = useRef<FitAddon>();

  useEffect(() => {
    const term = new Terminal({ cursorBlink: true });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    fit.fit();
    term.onData(onData);
    termRef.current = term;
    fitRef.current = fit;

    window.addEventListener('resize', () => fit.fit());
    return () => window.removeEventListener('resize', () => fit.fit());
  }, [onData]);

  // Expose write method
  useEffect(() => {
    if (termRef.current) write(termRef.current);
  }, [write]);

  return <div className="h-full w-full bg-black" ref={containerRef} />;
}
```

* Setup terminal on mount, fit to container, handle resize.
* Hook `onData` for stdin events; expose a `write` callback for stdout.

### 5. State & Data Flow

* **Context** or top‑level state in `app/editor/page.tsx`:

  * `code: string`
  * `stdin: string` (if needed)
  * `isRunning: boolean`
* **Actions**:

  1. `runCode()` → POST `/api/run` → receive `{ stdout, stderr }` → write to terminal.
  2. WebSocket connect to `/api/exec` → on data send to terminal, on user keystroke send to WS.

### 6. Styling & Layout

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
```

Two‑pane grid in editor page:

```html
<div className="flex flex-col h-screen">
  <Toolbar />
  <div className="flex flex-1 overflow-hidden">
    <div className="w-1/2 border-r"><Editor …/></div>
    <div className="w-1/2"><TerminalPane …/></div>
  </div>
</div>
```

### 7. Deployment (Vercel)

* Push to GitHub.
* Configure Vercel project; it auto-detects Next.js & TypeScript.
* Set environment variables (e.g., `PISTON_URL=http://…`).
* Deploy; preview URLs for each commit.

---

## Backend Implementation

### 1. Setup & Configuration

* **API** lives in `app/api/` (or `pages/api/`) within the same Next.js repo.
* Install dependencies:

  ```bash
  npm install ws node-fetch
  ```

### 2. API Routes

#### `/api/run` (HTTP)

```ts
// app/api/run.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { language, code, stdin } = req.body;
  const pistonRes = await fetch(`${process.env.PISTON_URL}/api/v2/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, version: '*', files: [{ name: 'code', content: code }], stdin }),
  });
  const json = await pistonRes.json();
  res.status(200).json({
    stdout: json.run.output,
    stderr: json.run.stderr,
    exitCode: json.run.code,
  });
}
```

#### `/api/exec` (WebSocket)

```ts
// app/api/exec.ts
import { WebSocketServer } from 'ws';
import type { NextApiRequest } from 'next';

export const config = { api: { bodyParser: false } };

export default function handler(req: NextApiRequest, res) {
  if (!res.socket.server.wss) {
    const wss = new WebSocketServer({ noServer: true });
    res.socket.server.on('upgrade', (request, socket, head) => {
      if (request.url === '/api/exec') wss.handleUpgrade(request, socket, head, ws => {
        // Connect to Piston WS and proxy messages
      });
    });
    res.socket.server.wss = wss;
  }
  res.end();
}
```

* On client WS connect, open a WS to `process.env.PISTON_WS_URL`.
* Pipe messages both ways: client → Piston STDIN; Piston STDOUT → client.

### 3. Piston Integration

* **HTTP**: `/api/v2/execute`
* **WebSocket**: stream sessions at WS endpoint (e.g., `/ws`)
* Ensure versions and container limits configured via Piston’s environment.

### 4. Environment & Secrets

* `.env.local` (not committed)

  ```
  PISTON_URL=http://localhost:2000
  PISTON_WS_URL=ws://localhost:2000/ws
  ```

### 5. Docker (Piston Engine)

```yaml
# docker-compose.yml
version: '3.8'
services:
  piston:
    image: ghcr.io/engineer-man/piston:latest
    ports:
      - "2000:2000"
    environment:
      - PISTON_ALLOW_NET=false
      - PISTON_TIMEOUT=10s
```

* `docker-compose up -d` to launch.
* Next.js API targets `http://piston:2000` when deployed to same host or use actual host URL.

### 6. Deployment Options

* **Co‑hosted**: Deploy Next.js (with API) on Vercel; host Piston separately on any Docker‑capable VPS (DigitalOcean, AWS EC2).
* **Fully managed**: Use a self‑managed Kubernetes cluster or AWS Fargate to run both Next.js and Piston containers.

---

## End‑to‑End Flow

1. **User** opens `/editor`.
2. Types code in Monaco editor.
3. Clicks **Run** → frontend POSTs to `/api/run`.
4. Next.js route forwards to Piston HTTP, returns output → terminal writes stdout/stderr.
5. For interactive programs, WS connection to `/api/exec` proxies I/O bidirectionally to Piston’s interactive session.

---

## Further Extensions

* **Authentication & User Accounts** (NextAuth.js)
* **Session Persistence** (save code snippets, share URLs)
* **Multi‑file Projects** (virtual file system in editor)
* **Collaboration** (real‑time co‑editing via Yjs or WebRTC)
* **AI Hints** (integrate OpenAI for code suggestions)
* **Analytics & Usage Metrics**

---

This document equips you to implement DevLaunch’s core MVP within a single Next.js + TypeScript project, paired with a Dockerized Piston engine. Happy coding!
