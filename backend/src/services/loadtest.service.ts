import { PrismaClient, LoadTestStatus, LoadTestPreset, HttpMethod } from '@prisma/client';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { validateTargetUrl } from '../utils/ssrf';
import { encryptSecret } from '../utils/crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class LoadTestService {
  constructor(
    private prisma: PrismaClient,
    private loadtestQueue?: Queue,
    private redis?: Redis
  ) {}

  async createLoadTest(userId: string, data: {
    name: string;
    projectId: string;
    endpointId?: string;
    targetUrl: string;
    method: HttpMethod;
    preset: LoadTestPreset;
    headers?: Record<string, string>;
    body?: any;
    authConfig?: any;
    vus: number;
    durationSeconds: number;
    rampUpSeconds: number;
    steadyStateSeconds: number;
    rampDownSeconds: number;
    thresholds: any[];
  }) {
    // 1. Fetch project to verify authorization
    const project = await this.prisma.project.findFirst({
      where: { id: data.projectId, userId },
    });

    if (!project) throw new Error('Project not found or unauthorized');

    // 2. Validate SSRF on target URL
    await validateTargetUrl(data.targetUrl);

    // 3. Enforce VU limits for unverified vs verified domains
    if (!project.isVerified && data.vus > env.MAX_VUS_UNVERIFIED) {
      throw new Error(
        `Target domain is unverified. Unverified targets are capped at ${env.MAX_VUS_UNVERIFIED} Virtual Users. Please complete domain verification first.`
      );
    }

    if (data.durationSeconds > env.MAX_TEST_DURATION_SECONDS) {
      throw new Error(`Test duration exceeds maximum allowed limit of ${env.MAX_TEST_DURATION_SECONDS} seconds.`);
    }

    // 4. Encrypt headers and auth secrets at rest
    const encryptedHeaders = data.headers ? encryptSecret(JSON.stringify(data.headers)) : null;
    const encryptedAuth = data.authConfig ? encryptSecret(JSON.stringify(data.authConfig)) : null;

    // 5. Create LoadTest record in database
    const loadTest = await this.prisma.loadTest.create({
      data: {
        projectId: project.id,
        endpointId: data.endpointId || null,
        name: data.name,
        status: 'QUEUED',
        preset: data.preset,
        targetUrl: data.targetUrl,
        method: data.method,
        headers: encryptedHeaders,
        body: data.body || null,
        authConfig: encryptedAuth,
        vus: data.vus,
        durationSeconds: data.durationSeconds,
        rampUpSeconds: data.rampUpSeconds,
        steadyStateSeconds: data.steadyStateSeconds,
        rampDownSeconds: data.rampDownSeconds,
        thresholds: data.thresholds,
      },
    });

    // 6. Enqueue job into BullMQ
    let job: any = null;
    if (this.loadtestQueue) {
      job = await this.loadtestQueue.add(
        'execute-loadtest',
        {
          loadTestId: loadTest.id,
          targetUrl: loadTest.targetUrl,
          method: loadTest.method,
          headers: data.headers,
          body: data.body,
          authConfig: data.authConfig,
          vus: loadTest.vus,
          durationSeconds: loadTest.durationSeconds,
          rampUpSeconds: loadTest.rampUpSeconds,
          steadyStateSeconds: loadTest.steadyStateSeconds,
          rampDownSeconds: loadTest.rampDownSeconds,
          thresholds: loadTest.thresholds,
        },
        {
          jobId: loadTest.id, // Pin BullMQ Job ID to the DB ID for clean cancellation
        }
      );
    }

    // 7. Audit log
    await this.prisma.auditLog.create({
      data: {
        userId,
        projectId: project.id,
        action: 'LOAD_TEST_STARTED',
        details: {
          loadTestId: loadTest.id,
          preset: loadTest.preset,
          vus: loadTest.vus,
          duration: loadTest.durationSeconds,
          targetUrl: loadTest.targetUrl,
        },
      },
    });

    logger.info(`Load test queued: ${loadTest.name}`, {
      loadTestId: loadTest.id,
      projectId: project.id,
      event: 'LOAD_TEST_STARTED',
    });

    return {
      jobId: job ? job.id : `job_${loadTest.id}`,
      status: 'queued',
      loadTest,
    };
  }

  async stopLoadTest(id: string, userId: string) {
    const loadTest = await this.prisma.loadTest.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!loadTest || loadTest.project.userId !== userId) {
      throw new Error('Load test not found or access denied');
    }

    // Publish cancellation message to Redis
    if (this.redis) {
      await this.redis.publish(`loadtest:cancel:${id}`, JSON.stringify({ loadTestId: id }));
    }

    // Update database status
    await this.prisma.loadTest.update({
      where: { id },
      data: {
        status: 'STOPPED',
        stoppedReason: 'Manually terminated by user',
        endedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        projectId: loadTest.projectId,
        action: 'LOAD_TEST_STOPPED',
        details: { loadTestId: id },
      },
    });

    logger.info(`Load test stopped: ${id}`, { loadTestId: id, event: 'LOAD_TEST_STOPPED' });

    return { success: true, message: 'Cancellation signal dispatched to worker.' };
  }

  async getLoadTest(id: string) {
    return this.prisma.loadTest.findUnique({
      where: { id },
      include: { project: true, endpoint: true, result: true },
    });
  }

  async listLoadTests(projectId?: string) {
    return this.prisma.loadTest.findMany({
      where: projectId ? { projectId } : undefined,
      include: { project: true, endpoint: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getResults(loadTestId: string) {
    return this.prisma.loadTestResult.findUnique({
      where: { loadTestId },
    });
  }

  async getMetrics(loadTestId: string) {
    return this.prisma.loadTestMetric.findMany({
      where: { loadTestId },
      orderBy: { timestamp: 'asc' },
      take: 100,
    });
  }
}
