import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import bodyParser from 'body-parser';

// Import controllers
import { executeCodeController, validateExecuteRequest, setExecutionService } from './controllers/execute.controller';

// Import services
import { setupSocketHandlers } from './services/socket.service';
import { DockerService } from './services/docker.service';
import { ExecutionService } from './services/execution.service';

// Initialize Express app
const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Configure middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send({ status: 'ok' });
});

// Initialize services
const dockerService = new DockerService();
const executionService = new ExecutionService(dockerService);

// Set execution service for the controller
setExecutionService(executionService);

// API routes
app.post('/api/execute', validateExecuteRequest, executeCodeController);

// Set up Socket.IO handlers
setupSocketHandlers(io, executionService);

// Start server
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is ready for connections`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    // Additional cleanup can be added here
    process.exit(0);
  });
});