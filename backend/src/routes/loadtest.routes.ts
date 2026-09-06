import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { LoadTestService } from '../services/loadtest.service';

const createLoadTestSchema = z.object({
  name: z.string().min(2),
  projectId: z.string(),
  endpointId: z.string().optional(),
  targetUrl: z.string().min(4),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
  preset: z.enum(['SMOKE', 'LOAD', 'STRESS', 'SPIKE', 'CUSTOM']),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
  authConfig: z.any().optional(),
  vus: z.number().int().min(1),
  durationSeconds: z.number().int().min(5),
  rampUpSeconds: z.number().int().min(0),
  steadyStateSeconds: z.number().int().min(5),
  rampDownSeconds: z.number().int().min(0),
  thresholds: z.array(z.any()).default([]),
});

export const loadtestRoutes: FastifyPluginAsync = async (fastify) => {
  const loadTestService = new LoadTestService(fastify.prisma, fastify.loadtestQueue, fastify.redis);

  // List all load tests
  fastify.get('/load-tests', { preHandler: [fastify.authenticate] }, async (request) => {
    const { projectId } = request.query as { projectId?: string };
    const tests = await loadTestService.listLoadTests(projectId);
    return { success: true, data: tests };
  });

  // Get single load test
  fastify.get('/load-tests/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const test = await loadTestService.getLoadTest(id);
    if (!test) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Load test not found.' },
      });
    }
    return { success: true, data: test };
  });

  // Create & Enqueue Load Test Job
  fastify.post('/load-tests', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parse = createLoadTestSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid load test configuration', details: parse.error.format() },
      });
    }

    try {
      const result = await loadTestService.createLoadTest(request.user.id, parse.data as any);
      return reply.status(202).send(result);
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { code: 'QUEUE_FAILED', message: err.message },
      });
    }
  });

  // Stop running load test
  fastify.post('/load-tests/:id/stop', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const result = await loadTestService.stopLoadTest(id, request.user.id);
      return result;
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { code: 'STOP_FAILED', message: err.message },
      });
    }
  });

  // Get final results report
  fastify.get('/load-tests/:id/results', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const results = await loadTestService.getResults(id);
    if (!results) {
      return reply.status(404).send({
        success: false,
        error: { code: 'RESULTS_NOT_FOUND', message: 'Test execution results not available yet.' },
      });
    }
    return { success: true, data: results };
  });

  // Get telemetry metrics time-series
  fastify.get('/load-tests/:id/metrics', { preHandler: [fastify.authenticate] }, async (request) => {
    const { id } = request.params as { id: string };
    const metrics = await loadTestService.getMetrics(id);
    return { success: true, data: metrics };
  });
};
