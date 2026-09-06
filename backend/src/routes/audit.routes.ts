import { FastifyPluginAsync } from 'fastify';

export const auditRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/audit-logs', { preHandler: [fastify.authenticate] }, async (request) => {
    const { projectId } = request.query as { projectId?: string };
    const logs = await fastify.prisma.auditLog.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        project: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      success: true,
      data: logs.map((l) => ({
        id: l.id,
        userId: l.userId,
        userName: l.user?.name || l.user?.email,
        projectId: l.projectId,
        projectName: l.project?.name,
        action: l.action,
        ipAddress: l.ipAddress,
        details: l.details,
        createdAt: l.createdAt.toISOString(),
      })),
    };
  });
};
