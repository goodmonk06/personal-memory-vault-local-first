import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { runMigrations } from './db/sqlite';
import { memoryRoutes } from './routes/memory-routes';
import { relationRoutes } from './routes/relation-routes';
import { queryRoutes } from './routes/query-routes';
import { syncRoutes } from './routes/sync-routes';
import { errorHandler } from './middleware/error-handler';
import { logger } from './lib/logger';
import { metrics } from './lib/metrics';

const fastify = Fastify({
  logger: false, // Use custom logger instead
  genReqId: () => {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
});

// Register error handler
fastify.setErrorHandler(errorHandler);

// Register CORS
fastify.register(cors, {
  origin: true, // Allow all origins in development
});

// Request logging middleware
fastify.addHook('onRequest', async (request, reply) => {
  const start = Date.now();
  reply.raw.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: duration,
    });
    metrics.recordDuration('http_request', duration, {
      method: request.method,
      path: request.routerPath || request.url,
      status: reply.statusCode,
    });
    metrics.recordCounter('http_requests_total', 1, {
      method: request.method,
      path: request.routerPath || request.url,
      status: reply.statusCode,
    });
  });
});

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Metrics endpoint
fastify.get('/metrics', async () => {
  return metrics.getSnapshot();
});

// API info
fastify.get('/', async () => {
  return {
    name: 'Personal Memory Vault API',
    version: '1.0.0',
    description: 'Local-first personal memory vault with AI query capabilities',
    endpoints: {
      memory: '/api/items',
      relations: '/api/relations',
      query: '/api/query',
      sync: '/api/sync',
    },
  };
});

// Register routes
fastify.register(memoryRoutes, { prefix: '/api' });
fastify.register(relationRoutes, { prefix: '/api' });
fastify.register(queryRoutes, { prefix: '/api' });
fastify.register(syncRoutes, { prefix: '/api' });

// Start server
const start = async () => {
  try {
    // Run migrations
    logger.info('Running database migrations...');
    runMigrations();

    // Start server
    await fastify.listen({
      port: config.server.port,
      host: config.server.host,
    });

    logger.info(`Memory Vault API started successfully`, {
      port: config.server.port,
      host: config.server.host,
      database: config.database.type,
    });

    console.log(`
🚀 Memory Vault API is running!

   Server: http://localhost:${config.server.port}
   Database: ${config.database.type}

   API Endpoints:
   • GET  /api/items          - List all memory items
   • POST /api/items          - Create a memory item
   • GET  /api/items/:id      - Get a memory item
   • PATCH /api/items/:id     - Update a memory item
   • DELETE /api/items/:id    - Delete a memory item

   • POST /api/query          - Query memories (AI endpoint)
   • GET  /api/query?q=text   - Query memories (simple)

   • POST /api/relations      - Create a relation
   • GET  /api/relations      - List all relations

   • GET  /api/sync/checkpoints - List sync checkpoints
   • POST /api/sync/checkpoints - Create/update checkpoint
   • POST /api/sync/pull       - Pull changes (stub)
   • POST /api/sync/push       - Push changes (stub)

   Monitoring:
   • GET  /health             - Health check
   • GET  /metrics            - Metrics snapshot
`);
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await fastify.close();
  process.exit(0);
});

start();
