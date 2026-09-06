import { PrismaClient, VerificationMethod } from '@prisma/client';
import crypto from 'crypto';
import { validateTargetUrl } from '../utils/ssrf';
import { normalizeUrl } from '../utils/url';
import { logger } from '../utils/logger';

export class ProjectService {
  constructor(private prisma: PrismaClient) {}

  async listProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { userId },
      include: {
        _count: {
          select: { endpoints: true, loadTests: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => ({
      ...p,
      endpointCount: p._count.endpoints,
      loadTestCount: p._count.loadTests,
    }));
  }

  async getProject(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { endpoints: true, loadTests: true },
        },
      },
    });

    if (!project) return null;

    return {
      ...project,
      endpointCount: project._count.endpoints,
      loadTestCount: project._count.loadTests,
    };
  }

  async createProject(userId: string, data: { name: string; targetUrl: string; verificationMethod?: VerificationMethod }) {
    // 1. SSRF & DNS Pre-resolution check
    const { safeUrl } = await validateTargetUrl(data.targetUrl);
    const normalizedUrl = normalizeUrl(safeUrl);

    // 2. Generate unique challenge verification token
    const verificationToken = `apiforge-verify-${crypto.randomBytes(8).toString('hex')}`;

    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        targetUrl: safeUrl,
        normalizedUrl,
        verificationMethod: data.verificationMethod || 'DNS_TXT',
        verificationToken,
        userId,
      },
    });

    // 3. Record immutable audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        projectId: project.id,
        action: 'PROJECT_CREATED',
        details: { name: project.name, targetUrl: safeUrl, verificationToken },
      },
    });

    logger.info(`Project registered: ${project.name}`, {
      projectId: project.id,
      userId,
      event: 'PROJECT_CREATED',
    });

    return project;
  }
}
