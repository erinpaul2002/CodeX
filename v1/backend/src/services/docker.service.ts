import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import os from 'os';
import stream from 'stream';

// Create temp directory for code files if it doesn't exist
const tempDir = path.join(__dirname, '../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export class DockerService {
  private docker: Docker;
  private readonly pythonImage = 'python:3.9-slim';

  constructor() {
    // Initialize Docker client with OS-specific settings
    if (os.platform() === 'win32') {
      // Windows - use default config which connects to the named pipe
      this.docker = new Docker();
    } else {
      // Unix systems - use the socket path
      this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
    }
    this.ensureImageExists();
  }

  /**
   * Ensure the required Docker image exists, pull if not
   */
  private async ensureImageExists(): Promise<void> {
    try {
      await this.docker.getImage(this.pythonImage).inspect();
      console.log(`Docker image ${this.pythonImage} already exists`);
    } catch (error) {
      console.log(`Docker image ${this.pythonImage} not found, pulling...`);
      await new Promise<void>((resolve, reject) => {
        this.docker.pull(this.pythonImage, (err: any, stream: any) => {
          if (err) {
            reject(err);
            return;
          }
          
          this.docker.modem.followProgress(stream, (err: any) => {
            if (err) {
              reject(err);
              return;
            }
            console.log(`Successfully pulled ${this.pythonImage}`);
            resolve();
          });
        });
      });
    }
  }

  /**
   * Create a Docker container with Python code to execute
   * @param code Python code to execute
   * @returns Docker container and file path
   */
  async createContainer(code: string): Promise<{ 
    container: Docker.Container; 
    filePath: string;
  }> {
    // Generate a unique file name for the code
    const fileName = `code_${uuidv4()}.py`;
    const filePath = path.join(tempDir, fileName);

    // Write code to a temporary file
    await writeFile(filePath, code);

    // Create container with resource limits
    const container = await this.docker.createContainer({
      Image: this.pythonImage,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: false,
      Tty: false,
      Cmd: ['python', `/app/${fileName}`],
      HostConfig: {
        Binds: [`${filePath}:/app/${fileName}`],
        Memory: 100 * 1024 * 1024, // 100 MB memory limit
        MemorySwap: 100 * 1024 * 1024, // Disable swap
        NanoCpus: 1 * 1000000000, // 1 CPU core
        NetworkMode: 'none', // Disable network access
        PidsLimit: 100, // Limit number of processes
        ReadonlyRootfs: true, // Make root filesystem read-only
      },
    });

    return { container, filePath };
  }

  /**
   * Start a container and get stream for I/O
   * @param container Docker container to start
   * @returns Streams for stdin, stdout, and stderr
   */
  async startContainer(container: Docker.Container): Promise<{
    stdin: NodeJS.WritableStream;
    stdout: NodeJS.ReadableStream;
    stderr: NodeJS.ReadableStream;
  }> {
    // Start the container
    await container.start();

    // Create separate streams for stdout and stderr
    const stdoutStream = new stream.PassThrough();
    const stderrStream = new stream.PassThrough();
    
    // Get the stream from Docker without setting encoding yet
    const dockerStream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
      hijack: true
    });

    // Important: DO NOT set encoding on the main stream for demultiplexing
    // Docker expects binary data for proper demultiplexing
    
    // Set up demultiplexing with error handling
    try {
      container.modem.demuxStream(dockerStream, stdoutStream, stderrStream);
      console.log('Stream demultiplexing set up successfully');
    } catch (error) {
      console.error('Error setting up stream demultiplexing:', error);
      throw error;
    }
    
    // Now set encoding on the output streams AFTER demultiplexing
    stdoutStream.setEncoding('utf8');
    stderrStream.setEncoding('utf8');
    
    // Debug events
    stdoutStream.on('close', () => console.log('stdout stream closed'));
    stderrStream.on('close', () => console.log('stderr stream closed'));
    dockerStream.on('close', () => console.log('docker stream closed'));
    
    // Add error handlers
    stdoutStream.on('error', (err) => console.error('stdout stream error:', err));
    stderrStream.on('error', (err) => console.error('stderr stream error:', err));
    dockerStream.on('error', (err) => console.error('docker stream error:', err));
    
    return { 
      stdin: dockerStream, 
      stdout: stdoutStream, 
      stderr: stderrStream 
    };
  }

  /**
   * Clean up resources after execution
   * @param container Docker container to clean up
   * @param filePath Path to code file
   */
  async cleanup(container: Docker.Container, filePath: string): Promise<void> {
    try {
      const containerInfo = await container.inspect();
      if (containerInfo.State.Running) {
        await container.stop();
      }
      await container.remove();
      await unlink(filePath);
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Continue with cleanup even if there are errors
    }
  }

  /**
   * Force stop and clean up a container
   * @param container Docker container to force stop
   * @param filePath Path to code file
   */
  async forceCleanup(container: Docker.Container, filePath: string): Promise<void> {
    try {
      await container.kill();
      await this.cleanup(container, filePath);
    } catch (error) {
      console.error('Error during force cleanup:', error);
      // Continue with cleanup even if there are errors
    }
  }
}