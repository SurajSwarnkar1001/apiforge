import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { ProjectService } from '../services/project.service';
import { VerificationService } from '../services/verification.service';

const createProjectSchema = z.object({
  name: z.string().min(2),
  targetUrl: z.string().min(4),
  verificationMethod: z.enum(['DNS_TXT', 'HTTP_FILE', 'SELF_DECLARATION']).optional(),
});

const verifyProjectSchema = z.object({
  method: z.enum(['DNS_TXT', 'HTTP_FILE', 'SELF_DECLARATION']),
});

export const projectRoutes: FastifyPluginAsync = async (fastify) => {
  const projectService = new ProjectService(fastify.prisma);
  const verificationService = new VerificationService(fastify.prisma);

  // List all projects
  fastify.get('/projects', { preHandler: [fastify.authenticate] }, async (request) => {
    const projects = await projectService.listProjects(request.user.id);
    return { success: true, data: projects };
  });

  // Get single project
  fastify.get('/projects/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await projectService.getProject(id, request.user.id);
    if (!project) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found.' },
      });
    }
    return { success: true, data: project };
  });

  // Create project
  fastify.post('/projects', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parse = createProjectSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid target URL or project name' },
      });
    }

    try {
      const project = await projectService.createProject(request.user.id, parse.data);
      return reply.status(201).send({ success: true, data: project });
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: { code: err.code || 'CREATION_FAILED', message: err.message },
      });
    }
  });

  // Verify project domain ownership
  fastify.post('/projects/:id/verify', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parse = verifyProjectSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid verification method' },
      });
    }

    const result = await verificationService.verifyTargetOwnership(id, parse.data.method as any);
    return result;
  });
};
