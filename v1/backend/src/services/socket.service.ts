import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionService } from './execution.service';

interface CodeExecutionRequest {
  code: string;
  language: string;
}

/**
 * Sets up Socket.IO handlers for real-time code execution
 * @param io Socket.IO server instance
 * @param executionService Execution service instance
 */
export function setupSocketHandlers(io: Server, executionService: ExecutionService): void {
  // Handle new connections
  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Handle execute event
    socket.on('execute', async (data: CodeExecutionRequest, callback) => {
      try {
        // Validate request
        if (!data.code) {
          socket.emit('error', { error: 'No code provided' });
          return;
        }

        // Only support Python for now
        if (data.language && data.language !== 'python') {
          socket.emit('error', { error: 'Only Python is supported at this time' });
          return;
        }

        // Generate a unique session ID
        const sessionId = uuidv4();

        // Join a room specific to this execution session
        socket.join(sessionId);

        // REGISTER THE SOCKET FIRST - this ensures input can be handled
        executionService.registerSocket(sessionId, socket);
        
        // Send acknowledgment to client with session ID
        if (typeof callback === 'function') {
          callback({ success: true, sessionId });
        }

        // THEN execute the code
        await executionService.executeCode(data.code, sessionId);
        
        // Notify client that execution has started
        socket.emit('execution_started', { sessionId });
      } catch (error) {
        console.error('Error handling execute event:', error);
        socket.emit('error', { error: 'Failed to execute code' });
      }
    });

    // Handle input event
    socket.on('input', ({ sessionId, input }: { sessionId: string; input: string }) => {
      if (!sessionId || typeof input !== 'string') {
        socket.emit('error', { error: 'Invalid input request' });
        return;
      }

      console.log(`[DEBUG] Received input from client for session ${sessionId}: "${input}"`);
      
      // Forward input to execution service
      executionService.handleInput(sessionId, input);
    });

    // Handle join_session event
    socket.on('join_session', ({ sessionId }) => {
      if (!sessionId) return;
      
      console.log(`Client ${socket.id} joining session room: ${sessionId}`);
      socket.join(sessionId);
      
      // Log all sockets in the room
      const room = io.sockets.adapter.rooms.get(sessionId);
      console.log(`Room ${sessionId} has ${room ? room.size : 0} clients`);
      
      // Re-register the socket with the execution service
      executionService.registerSocket(sessionId, socket);
      
      // Test the room broadcast
      io.to(sessionId).emit('test', { message: 'Room broadcast test' });
    });

    // Handle ping event
    socket.on('ping', () => {
      console.log(`Ping received from client ${socket.id}`);
      socket.emit('pong');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      // Any cleanup needed can be done here
    });
  });
}

/**
 * Creates a session ID and room for a code execution request
 * @param socket Client socket
 * @returns Session ID
 */
function createExecutionSession(socket: Socket): string {
  const sessionId = uuidv4();
  socket.join(sessionId);
  return sessionId;
}