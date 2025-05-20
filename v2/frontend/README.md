# DevLaunch Mini-IDE

A lightweight, browser-based code editor and execution environment built with Next.js, Monaco Editor, and xterm.js.

## Features

- **Monaco Editor** with syntax highlighting and IntelliSense
- **Integrated Terminal** powered by xterm.js
- **Multiple Language Support** via Piston engine
- **Run Code** directly from your browser
- **Interactive Sessions** (coming soon) for programs that need stdin

## Tech Stack

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Editor**: Monaco Editor
- **Terminal**: xterm.js with xterm-addon-fit
- **Execution Engine**: Piston (Docker container)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Docker Deployment

You can run the entire application (frontend + Piston) using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- The Next.js frontend on port 3000
- The Piston execution engine on port 2000

## Configuration

Environment variables:

- `PISTON_URL`: URL of the Piston API (default: http://localhost:2000)
- `PISTON_WS_URL`: URL of the Piston WebSocket endpoint (default: ws://localhost:2000/ws)

## Project Structure

```
/
├── app/                  # Next.js App
│   ├── api/              # API routes
│   │   ├── run/          # HTTP run endpoint
│   │   └── exec/         # WebSocket exec endpoint
│   ├── editor/           # Editor + terminal workspace
│   ├── page.tsx          # Landing page
│   ├── layout.tsx        # Shared layout
│   └── globals.css       # Global styles
├── components/           # Shared UI components
│   ├── Editor.tsx        # Monaco Editor wrapper
│   └── Terminal.tsx      # xterm.js wrapper
├── public/               # Static assets
└── Dockerfile            # Docker configuration
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
