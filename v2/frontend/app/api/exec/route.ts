import { NextRequest } from 'next/server';

// Set the runtime to edge for WebSocket support
export const runtime = 'edge';

// Set dynamic response handling
export const dynamic = 'force-dynamic';

// Get the Piston WebSocket URL from environment or use service name in Docker
const PISTON_WS_URL = process.env.PISTON_WS_URL || 'ws://api:2000/ws';
// When running in Docker Compose network, use service name 'api'
// When running locally outside Docker, keep using 'localhost'

// Extend ResponseInit type to include webSocket property for Edge Runtime
interface WebSocketResponseInit extends ResponseInit {
  webSocket: WebSocket;
}

export async function GET(req: NextRequest) {
  // Check if the incoming request is a WebSocket request
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket request', { status: 400 });
  }

  try {
    // Create a pair of WebSocket objects
    const { 0: clientSocket, 1: serverSocket } = new WebSocketPair();
    
    // Accept the client connection
    serverSocket.accept();

    // Connect to Piston WebSocket
    const pistonSocket = new WebSocket(PISTON_WS_URL);
    
    // Wait for Piston connection to be established
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Piston WebSocket connection timeout')), 5000);
      
      pistonSocket.onopen = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      pistonSocket.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });

    // Forward messages from client to Piston
    serverSocket.addEventListener('message', (event) => {
      console.log('Client -> Piston:', event.data.slice(0, 100) + (event.data.length > 100 ? '...' : ''));
      pistonSocket.send(event.data);
    });
    
    // Forward messages from Piston to client
    pistonSocket.onmessage = (event) => {
      console.log('Piston -> Client:', event.data.slice(0, 100) + (event.data.length > 100 ? '...' : ''));
      serverSocket.send(event.data);
    };
    
    // Handle close events
    serverSocket.addEventListener('close', (event) => {
      console.log('Client connection closed:', event.code, event.reason);
      if (pistonSocket.readyState === WebSocket.OPEN) {
        pistonSocket.close(event.code, event.reason);
      }
    });
    
    pistonSocket.onclose = (event) => {
      console.log('Piston connection closed:', event.code, event.reason);
      if (serverSocket.readyState === WebSocket.OPEN) {
        serverSocket.close(event.code, event.reason);
      }
    };
    
    // Handle errors
    serverSocket.addEventListener('error', (error) => {
      console.error('Client WebSocket error:', error);
    });
    
    pistonSocket.onerror = (error) => {
      console.error('Piston WebSocket error:', error);
    };

    // Return a response with the client socket
    return new Response(null, {
      status: 101,
      webSocket: clientSocket,
    } as WebSocketResponseInit);
  } catch (err: unknown) {
    console.error('WebSocket setup error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return new Response(`WebSocket Error: ${errorMessage}`, { status: 500 });
  }
}

// WebSocketPair class for the Edge Runtime
class WebSocketPair extends Array<WebSocket> {
  constructor() {
    super(2);
    
    // Create a MessageChannel for communication
    const { port1, port2 } = new MessageChannel();
    
    // Create WebSocket instances using MessagePorts
    // Use a more specific type assertion 
    this[0] = new WebSocket(null as unknown as string);
    this[0]._port = port1;
    
    this[1] = new WebSocket(null as unknown as string);
    this[1]._port = port2;
    
    // Connect the ports
    port1.onmessage = (event) => this[0].dispatchEvent(new MessageEvent('message', { data: event.data }));
    port2.onmessage = (event) => this[1].dispatchEvent(new MessageEvent('message', { data: event.data }));
  }
}

// Extend WebSocket with additional methods for Edge Runtime
declare global {
  interface WebSocket {
    accept(): void;
    _port?: MessagePort;
  }
}

// Add missing methods to WebSocket prototype
if (typeof WebSocket !== 'undefined') {
  WebSocket.prototype.accept = function() {
    // Implementation for accepting connections
  };
  
  const originalSend = WebSocket.prototype.send;
  // Use a union type matching WebSocket.send() allowed parameter types
  WebSocket.prototype.send = function(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (this._port) {
      this._port.postMessage(data);
      return;
    }
    return originalSend.call(this, data);
  };
}
