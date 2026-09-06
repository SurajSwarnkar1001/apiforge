import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import prismaPlugin from './plugins/prisma';
import redisPlugin from './plugins/redis';
import jwtPlugin from './plugins/jwt';
import websocketPlugin from './plugins/websocket';
import { authRoutes } from './routes/auth.routes';
import { projectRoutes } from './routes/project.routes';
import { scanRoutes } from './routes/scan.routes';
import { endpointRoutes } from './routes/endpoint.routes';
import { loadtestRoutes } from './routes/loadtest.routes';
import { auditRoutes } from './routes/audit.routes';
import { env } from './config/env';
import { logger } from './utils/logger';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: false, // We use custom structured logger
    trustProxy: true,
  });

  // Global plugins
  await server.register(sensible);
  await server.register(cors, {
    origin: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
    credentials: true,
  });

  await server.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Database, Redis, Auth & WS
  await server.register(prismaPlugin);
  await server.register(redisPlugin);
  await server.register(jwtPlugin);
  await server.register(websocketPlugin);

  // Health check
  server.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString(), platform: 'APIForge' };
  });

  // API Routes with /api prefix
  await server.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(projectRoutes);
      await api.register(scanRoutes);
      await api.register(endpointRoutes);
      await api.register(loadtestRoutes);
      await api.register(auditRoutes);
    },
    { prefix: '/api' }
  );

  // Consistent Error Handler
  server.setErrorHandler((error: any, request, reply) => {
    logger.error(`API Error on ${request.method} ${request.url}: ${error.message}`, {
      stack: error.stack,
      statusCode: error.statusCode,
    });

    const statusCode = error.statusCode || 500;
    reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: statusCode === 500 ? 'An unexpected server error occurred.' : error.message,
      },
    });
  });

  return server;
}
