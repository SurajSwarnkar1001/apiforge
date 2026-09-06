import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { EndpointService } from '../services/endpoint.service';

const executeSchema = z.object({
  headers: z.record(z.string()).optional(),
  queryParams: z.record(z.string()).optional(),
  body: z.any().optional(),
});

export const endpointRoutes: FastifyPluginAsync = async (fastify) => {
  const endpointService = new EndpointService(fastify.prisma);

  // List all endpoints (or filter by project)
  fastify.get('/endpoints', { preHandler: [fastify.authenticate] }, async (request) => {
    const { projectId } = request.query as { projectId?: string };
    const endpoints = await endpointService.listEndpoints(projectId);
    return { success: true, data: endpoints };
  });

  // List endpoints by project ID
  fastify.get('/projects/:id/endpoints', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const endpoints = await endpointService.listEndpoints(id);
    return { success: true, data: endpoints };
  });

  // Get single endpoint
  fastify.get('/endpoints/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const endpoint = await endpointService.getEndpoint(id);
    if (!endpoint) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Endpoint not found' },
      });
    }
    return { success: true, data: endpoint };
  });

  // Safe single-shot test execution proxy
  fastify.post('/endpoints/:id/execute', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = executeSchema.safeParse(request.body || {});

    try {
      const result = await endpointService.executeSingleRequest(id, parse.data || {});
      return result;
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { code: 'EXECUTION_FAILED', message: err.message },
      });
    }
  });
};
