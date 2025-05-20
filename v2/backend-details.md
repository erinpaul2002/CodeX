# CodeX: Backend Implementation Details

This document provides additional information about the backend implementation for the CodeX Student IDE project, focusing on the Piston code execution engine and related infrastructure.

## Piston Engine Overview

[Piston](https://github.com/engineer-man/piston) is an open-source code execution engine that:

- Provides a sandboxed environment for running code
- Supports numerous programming languages
- Offers both HTTP and WebSocket interfaces
- Uses container isolation for security
- Handles resource limits and timeouts

## API Endpoints

### Piston v2 API Reference

The key Piston API endpoints that we'll be integrating with are:

#### 1. Execute Code (HTTP)

```
POST /api/v2/execute
```

**Request Body:**
```json
{
  "language": "python",
  "version": "*",
  "files": [
    {
      "name": "main.py",
      "content": "print('Hello, world!')"
    }
  ],
  "stdin": "",
  "args": [],
  "compile_timeout": 10000,
  "run_timeout": 3000,
  "compile_memory_limit": -1,
  "run_memory_limit": -1
}
```

**Response:**
```json
{
  "language": "python",
  "version": "3.10.0",
  "run": {
    "stdout": "Hello, world!\n",
    "stderr": "",
    "output": "Hello, world!\n",
    "code": 0,
    "signal": null
  }
}
```

#### 2. List Available Runtimes

```
GET /api/v2/runtimes
```

**Response:**
```json
[
  {
    "language": "python",
    "version": "3.10.0",
    "aliases": ["python3", "py"]
  },
  {
    "language": "nodejs",
    "version": "18.12.1",
    "aliases": ["node", "javascript", "js"]
  },
  ...
]
```

## WebSocket Implementation

For interactive programs that require stdin during execution, we'll need to implement WebSocket support:

1. Client connects to our WebSocket endpoint `/api/exec`
2. Our endpoint proxies to Piston's WebSocket
3. Messages flow bidirectionally:
   - Client → Our WS → Piston WS (for stdin)
   - Piston WS → Our WS → Client (for stdout/stderr)

### Next.js App Router WebSocket Implementation Notes

Next.js App Router requires special handling for WebSockets:

1. Use the `upgrade` header to detect WebSocket connections
2. Return a streaming Response for WebSocket communications
3. Establish connection to Piston WebSocket
4. Proxy messages between client and Piston

## Docker Setup

The Docker Compose configuration includes:

1. **Piston Container**:
   - Image: `ghcr.io/engineer-man/piston:latest`
   - Port: 2000
   - Environment variables:
     - `PISTON_ALLOW_NET=false` (security measure)
     - `PISTON_TIMEOUT=10s` (execution timeout)

2. **Frontend Container**:
   - Next.js application
   - Port: 3000
   - Environment variables point to Piston

## Security Considerations

1. **Code Execution Isolation**:
   - Piston provides container isolation
   - Limits on execution time
   - Memory restrictions

2. **API Security**:
   - Rate limiting to prevent abuse
   - Input validation
   - No direct execution of system commands

3. **Network Security**:
   - Restricted network access for executed code
   - Internal container network for frontend-backend communication

## Scaling Strategy

For handling increased load:

1. **Horizontal Scaling**:
   - Multiple Piston instances behind load balancer
   - Stateless API design

2. **Resource Management**:
   - Appropriate container limits
   - Efficient cleanup of completed executions
   - Caching for common operations

## Monitoring and Logging

1. **Health Checks**:
   - Regular pings to Piston API
   - Container health monitoring

2. **Logging**:
   - Execution requests and results
   - Error tracking
   - Performance metrics

3. **Alerting**:
   - Notification for service disruptions
   - Resource utilization alerts

## Backend Development Steps

1. Set up Docker environment with Piston
2. Implement basic HTTP execution endpoint
3. Add language listing endpoint
4. Implement WebSocket proxy
5. Add security measures
6. Test with various languages and input types
7. Configure for production deployment

## Configuration Parameters

Key configuration options for the Piston container:

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `PISTON_ALLOW_NET` | Allow network access from code | `false` |
| `PISTON_TIMEOUT` | Maximum execution time | `10s` |
| `PISTON_MEMORY_LIMIT` | Maximum memory allocation | `unlimited` |
| `PISTON_OUTPUT_MAX_SIZE` | Maximum output size | `unlimited` |

## Troubleshooting Common Issues

1. **Container Startup Failures**:
   - Check Docker logs: `docker logs <container_id>`
   - Verify port availability
   - Check for permission issues

2. **Execution Failures**:
   - Verify Piston API connectivity
   - Check language support
   - Inspect execution logs

3. **WebSocket Connection Issues**:
   - Confirm WebSocket protocol handling
   - Check for proper message formatting
   - Verify proxy configuration

## Resources

- [Piston GitHub Repository](https://github.com/engineer-man/piston)
- [Piston API Documentation](https://github.com/engineer-man/piston#api-documentation)
- [Docker Documentation](https://docs.docker.com/)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
