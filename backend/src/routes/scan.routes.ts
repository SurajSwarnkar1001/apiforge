import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ScanService } from '../services/scan.service';

const scanSchema = z.object({
  strategies: z.array(z.string()).optional(),
});

export const scanRoutes: FastifyPluginAsync = async (fastify) => {
  const scanService = new ScanService(fastify.prisma, fastify.discoveryQueue);

  // Trigger discovery scan
  fastify.post('/projects/:id/scan', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = scanSchema.safeParse(request.body || {});

    try {
      const scan = await scanService.createScan(
        id,
        request.user.id,
        parse.success && parse.data.strategies ? parse.data.strategies : undefined
      );
      return reply.status(202).send({ success: true, data: scan });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { code: 'SCAN_FAILED', message: err.message },
      });
    }
  });

  // Get scan progress
  fastify.get('/projects/:id/scan/:scanId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id, scanId } = request.params as { id: string; scanId: string };
    const scan = await scanService.getScan(scanId, id);
    if (!scan) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Scan not found.' },
      });
    }
    return { success: true, data: scan };
  });
};
