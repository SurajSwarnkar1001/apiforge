import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { logger } from '../utils/logger';

export class ScanService {
  constructor(private prisma: PrismaClient, private discoveryQueue?: Queue) {}

  async createScan(projectId: string, userId: string, strategies: string[] = ['OPENAPI', 'PLAYWRIGHT', 'JS_BUNDLE']) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) throw new Error('Project not found');

    const scan = await this.prisma.scan.create({
      data: {
        projectId,
        status: 'RUNNING',
        strategies: strategies.map((s) => ({
          strategy: s,
          status: 'PENDING',
          endpointsDiscovered: 0,
          durationMs: 0,
        })),
      },
    });

    if (this.discoveryQueue) {
      await this.discoveryQueue.add('discover-endpoints', {
        scanId: scan.id,
        projectId: project.id,
        targetUrl: project.targetUrl,
        strategies,
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId,
        projectId,
        action: 'DISCOVERY_SCAN_TRIGGERED',
        details: { scanId: scan.id, strategies, targetUrl: project.targetUrl },
      },
    });

    logger.info(`Scan enqueued for project ${project.name}`, {
      scanId: scan.id,
      projectId,
      event: 'DISCOVERY_SCAN_TRIGGERED',
    });

    return scan;
  }

  async getScan(scanId: string, projectId: string) {
    return this.prisma.scan.findFirst({
      where: { id: scanId, projectId },
    });
  }
}
