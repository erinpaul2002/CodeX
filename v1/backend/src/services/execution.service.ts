import { Socket } from 'socket.io';
import { DockerService } from './docker.service';
import Docker from 'dockerode';
import stream from 'stream';
import { io } from '../index'; // Make sure this is exported from index.ts

interface ExecutionSession {
  sessionId: string;
  container: Docker.Container;
  filePath: string;
  socket?: Socket;
  stdin?: NodeJS.WritableStream;
  stdout?: NodeJS.ReadableStream;
  stderr?: NodeJS.ReadableStream;
  timeout?: NodeJS.Timeout;
  isWaitingForInput: boolean;
  outputBuffer: string;
}

export class ExecutionService {
  private sessions: Map<string, ExecutionSession> = new Map();
  private readonly MAX_EXECUTION_TIME = 30000; // 30 seconds
  private cleaningUp = new Set<string>();

  constructor(private dockerService: DockerService) {}

  /**
   * Execute code in Docker container and handle I/O through WebSocket
   * @param code Python code to execute
   * @param sessionId Unique session ID
   */
  async executeCode(code: string, sessionId: string): Promise<void> {
    try {
      // Create container with code
      console.log(`Creating container for session ${sessionId}`);
      const { container, filePath } = await this.dockerService.createContainer(code);
      console.log(`Container created for session ${sessionId}`);
      
      // Store session information
      this.sessions.set(sessionId, {
        sessionId,
        container,
        filePath,
        isWaitingForInput: false,
        outputBuffer: ''
      });

      // Set execution timeout
      const timeout = setTimeout(() => {
        this.handleTimeout(sessionId);
      }, this.MAX_EXECUTION_TIME);

      // Update session with timeout
      this.sessions.set(sessionId, {
        ...this.sessions.get(sessionId)!,
        timeout
      });

      // Start the container
      const { stdin, stdout, stderr } = await this.dockerService.startContainer(container);
      
      // Update session with streams
      this.sessions.set(sessionId, {
        ...this.sessions.get(sessionId)!,
        stdin,
        stdout,
        stderr
      });

      // Set up stream handling
      this.handleOutputStream(stdout, sessionId);
      this.handleErrorStream(stderr, sessionId);

    } catch (error) {
      console.error('Error executing code:', error);
      let errorMessage = 'Failed to execute code';
      
      // More specific error messages
      if (error instanceof Error && error.message.includes('Cannot connect to the Docker daemon')) {
        errorMessage = 'Docker daemon is not running or not accessible';
      }
      
      this.emitToSocket(sessionId, 'error', { error: errorMessage });
      await this.cleanupSession(sessionId);
    }
  }

  /**
   * Handle stdout stream from Docker container
   * @param outputStream Docker container stdout stream
   * @param sessionId Session ID
   */
  private handleOutputStream(outputStream: NodeJS.ReadableStream, sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Add this debug listener
    outputStream.on('error', (err) => {
      console.error(`[CRITICAL] Stream processing error in stdout for ${sessionId}:`, err);
    });

    outputStream.on('data', (data: Buffer | string) => {
      // Add robust type checking
      let output: string;
      
      if (Buffer.isBuffer(data)) {
        output = data.toString('utf8');
        console.log(`[DEBUG] Received buffer data, converted to string`);
      } else if (typeof data === 'string') {
        output = data;
        console.log(`[DEBUG] Received string data directly`);
      } else {
        console.error(`[ERROR] Unexpected data type:`, typeof data);
        return;
      }
      
      // Add to output buffer
      session.outputBuffer += output;
      console.log(`[DEBUG] Output from container: "${output.replace(/\n/g, '\\n')}"`);
      
      // More robust input detection - make this more aggressive
      const isWaitingForInput = 
        output.includes(': ') || 
        output.includes('? ') || 
        output.includes('input(') ||
        /[?:]\s*$/.test(output);
      
      if (isWaitingForInput) {
        console.log(`[DEBUG] Detected input prompt, setting isWaitingForInput = true`);
        session.isWaitingForInput = true;
        this.sessions.set(sessionId, {...session}); // Explicitly update the session
        this.emitToSocket(sessionId, 'input_required');
      }

      // Emit output to frontend
      this.emitToSocket(sessionId, 'output', { output });
    });

    outputStream.on('end', () => {
      console.log(`[DEBUG] Output stream ended for session ${sessionId}`);
      this.emitToSocket(sessionId, 'execution_complete');
      this.cleanupSession(sessionId);
    });

    outputStream.on('error', (error) => {
      console.error(`Stream error for session ${sessionId}:`, error);
      this.emitToSocket(sessionId, 'error', { error: 'Stream error occurred' });
      this.cleanupSession(sessionId);
    });
  }

  /**
   * Handle stderr stream from Docker container
   * @param errorStream Docker container stderr stream
   * @param sessionId Session ID
   */
  private handleErrorStream(errorStream: NodeJS.ReadableStream, sessionId: string): void {
    errorStream.on('data', (data: Buffer) => {
      const error = data.toString('utf8');
      this.emitToSocket(sessionId, 'error', { error });
    });
  }

  /**
   * Handle user input and send to Docker container
   * @param sessionId Session ID
   * @param input User input text
   */
  async handleInput(sessionId: string, input: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.stdin) {
      console.error('No active session found or stdin not available');
      return;
    }

    try {
      console.log(`[DEBUG] Sending input to container: "${input}"`);
      
      // Convert input to buffer and write to stdin with newline
      const inputBuffer = Buffer.from(input + '\n', 'utf8');
      
      // Write to stdin and ensure it's flushed
      session.stdin.write(inputBuffer, (err) => {
        if (err) {
          console.error('Error writing to stdin:', err);
          this.emitToSocket(sessionId, 'error', { error: 'Failed to send input' });
        } else {
          console.log(`[DEBUG] Input successfully written to container`);
        }
      });
      
      // Reset input waiting state
      session.isWaitingForInput = false;
    } catch (error) {
      console.error('Error sending input to container:', error);
      this.emitToSocket(sessionId, 'error', { error: 'Failed to send input' });
    }
  }

  /**
   * Register a socket with a session for communication
   * @param sessionId Session ID
   * @param socket Socket.IO socket
   */
  registerSocket(sessionId: string, socket: Socket): void {
    // If no session exists yet, create a minimal placeholder
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        isWaitingForInput: false,
        outputBuffer: ''
      } as ExecutionSession);
    }

    // Update session with socket
    this.sessions.set(sessionId, {
      ...this.sessions.get(sessionId)!,
      socket
    });
  
    // Set up socket event listeners
    socket.on('input', ({ input }) => {
      this.handleInput(sessionId, input);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected for session ${sessionId}`);
      this.cleanupSession(sessionId);
    });
  }

  /**
   * Handle execution timeout
   * @param sessionId Session ID
   */
  private handleTimeout(sessionId: string): void {
    console.log(`Execution timeout for session ${sessionId}`);
    this.emitToSocket(sessionId, 'error', { error: 'Execution timed out (max 30 seconds)' });
    this.cleanupSession(sessionId);
  }

  /**
   * Clean up resources for a session
   * @param sessionId Session ID
   */
  private async cleanupSession(sessionId: string): Promise<void> {
    // Skip if already cleaning up
    if (this.cleaningUp.has(sessionId)) return;
    
    this.cleaningUp.add(sessionId);
    try {
      const session = this.sessions.get(sessionId);
      if (!session) return;

      // Clear timeout if exists
      if (session.timeout) {
        clearTimeout(session.timeout);
      }

      // Clean up Docker resources
      try {
        await this.dockerService.cleanup(session.container, session.filePath);
      } catch (error) {
        console.error('Error during cleanup:', error);
      }

      // Remove session from map
      this.sessions.delete(sessionId);
      
      console.log(`Session ${sessionId} cleaned up`);
    } finally {
      this.cleaningUp.delete(sessionId);
    }
  }

  /**
   * Force cleanup of a session
   * @param sessionId Session ID
   */
  async forceCleanupSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      await this.dockerService.forceCleanup(session.container, session.filePath);
      this.sessions.delete(sessionId);
    } catch (error) {
      console.error('Error during force cleanup:', error);
    }
  }

  /**
   * Emit an event to the socket if available
   * @param sessionId Session ID
   * @param event Event name
   * @param data Event data
   */
  private emitToSocket(sessionId: string, event: string, data: any = {}): void {
    // Log that we're emitting the event
    console.log(`Emitting ${event} to session ${sessionId}:`, data);
    
    // Emit to the entire room using the io instance
    io.to(sessionId).emit(event, data);
  }
}