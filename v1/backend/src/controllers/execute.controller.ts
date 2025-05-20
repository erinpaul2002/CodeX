import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionService } from '../services/execution.service';
import { body, validationResult } from 'express-validator';

// Store execution service instance (will be initialized in index.ts)
let executionServiceInstance: ExecutionService;

/**
 * Set the execution service instance for the controller to use
 * @param service ExecutionService instance
 */
export function setExecutionService(service: ExecutionService): void {
  executionServiceInstance = service;
}

/**
 * Validation middleware for code execution requests
 */
export const validateExecuteRequest = [
  body('code').isString().notEmpty().withMessage('Code must be a non-empty string'),
  body('language').isString().default('python').withMessage('Language must be a string')
];

/**
 * Execute code via HTTP API (for non-WebSocket clients)
 * Returns a session ID that can be used for WebSocket connections
 * @param req Express request
 * @param res Express response
 */
export async function executeCodeController(req: Request, res: Response): Promise<void> {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    // Extract data from request
    const { code, language } = req.body;
    
    // Only support Python for now
    if (language !== 'python') {
      res.status(400).json({ error: 'Only Python is supported at this time' });
      return;
    }

    // Check if execution service is available
    if (!executionServiceInstance) {
      res.status(500).json({ error: 'Execution service not initialized' });
      return;
    }

    // Generate a unique session ID
    const sessionId = uuidv4();

    // Return session ID to client immediately
    res.status(200).json({ 
      message: 'Code execution started', 
      sessionId 
    });

    // Execute the code (async, will communicate results via WebSocket)
    await executionServiceInstance.executeCode(code, sessionId);
  } catch (error) {
    console.error('Error executing code:', error);
    res.status(500).json({ error: 'Failed to execute code' });
  }
}