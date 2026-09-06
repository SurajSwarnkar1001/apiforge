import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { K6Runner } from './k6/k6Runner';
import { K6JobConfig } from './k6/scriptGenerator';

const prisma = new PrismaClient();

export async function processLoadTestJob(job: Job<K6JobConfig>, redis: Redis) {
  const config = job.data;
  console.log(`[LoadTest Worker] Processing test job ${config.loadTestId} for target ${config.targetUrl}`);

  // 1. Update status to RUNNING in database
  await prisma.loadTest.update({
    where: { id: config.loadTestId },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  // Notify WebSocket subscribers
  await redis.publish(
    `loadtest:status:${config.loadTestId}`,
    JSON.stringify({ status: 'RUNNING' })
  );

  const runner = new K6Runner(redis);

  try {
    // 2. Run test and stream metrics
    const finalResult = await runner.run(config, async (snapshot) => {
      // Publish to Redis Pub/Sub for realtime WebSocket forwarding
      await redis.publish(
        `loadtest:metrics:${config.loadTestId}`,
        JSON.stringify(snapshot)
      );

      // Persist snapshot to database
      try {
        await prisma.loadTestMetric.create({
          data: {
            loadTestId: config.loadTestId,
            timestamp: new Date(snapshot.timestamp),
            vus: snapshot.vus,
            rps: snapshot.rps,
            latencyAvg: snapshot.latencyAvg,
            latencyMin: snapshot.latencyMin,
            latencyMax: snapshot.latencyMax,
            latencyP50: snapshot.latencyP50,
            latencyP90: snapshot.latencyP90,
            latencyP95: snapshot.latencyP95,
            latencyP99: snapshot.latencyP99,
            errorRate: snapshot.errorRate,
            totalRequests: snapshot.totalRequests,
            successfulRequests: snapshot.successfulRequests,
            failedRequests: snapshot.failedRequests,
            status2xx: snapshot.status2xx,
            status4xx: snapshot.status4xx,
            status5xx: snapshot.status5xx,
          },
        });
      } catch {}
    });

    // 3. Persist final results
    await prisma.loadTestResult.upsert({
      where: { loadTestId: config.loadTestId },
      update: {
        totalRequests: finalResult.totalRequests,
        successfulRequests: finalResult.successfulRequests,
        failedRequests: finalResult.failedRequests,
        avgRps: finalResult.avgRps,
        avgLatencyMs: finalResult.avgLatencyMs,
        minLatencyMs: finalResult.minLatencyMs,
        maxLatencyMs: finalResult.maxLatencyMs,
        p50Ms: finalResult.p50Ms,
        p90Ms: finalResult.p90Ms,
        p95Ms: finalResult.p95Ms,
        p99Ms: finalResult.p99Ms,
        errorRatePercent: finalResult.errorRatePercent,
        httpStatusBreakdown: finalResult.httpStatusBreakdown,
        thresholdsSummary: finalResult.thresholdsSummary,
        stdoutLog: finalResult.stdoutLog,
      },
      create: {
        loadTestId: config.loadTestId,
        totalRequests: finalResult.totalRequests,
        successfulRequests: finalResult.successfulRequests,
        failedRequests: finalResult.failedRequests,
        avgRps: finalResult.avgRps,
        avgLatencyMs: finalResult.avgLatencyMs,
        minLatencyMs: finalResult.minLatencyMs,
        maxLatencyMs: finalResult.maxLatencyMs,
        p50Ms: finalResult.p50Ms,
        p90Ms: finalResult.p90Ms,
        p95Ms: finalResult.p95Ms,
        p99Ms: finalResult.p99Ms,
        errorRatePercent: finalResult.errorRatePercent,
        httpStatusBreakdown: finalResult.httpStatusBreakdown,
        thresholdsSummary: finalResult.thresholdsSummary,
        stdoutLog: finalResult.stdoutLog,
      },
    });

    // 4. Mark status COMPLETED unless already stopped
    const currentTest = await prisma.loadTest.findUnique({ where: { id: config.loadTestId } });
    if (currentTest?.status !== 'STOPPED') {
      await prisma.loadTest.update({
        where: { id: config.loadTestId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
        },
      });

      await redis.publish(
        `loadtest:status:${config.loadTestId}`,
        JSON.stringify({ status: 'COMPLETED' })
      );
    }

    console.log(`[LoadTest Worker] Test ${config.loadTestId} finished successfully.`);
  } catch (err: any) {
    console.error(`[LoadTest Worker] Test ${config.loadTestId} encountered error:`, err);
    await prisma.loadTest.update({
      where: { id: config.loadTestId },
      data: {
        status: 'FAILED',
        stoppedReason: err.message,
        endedAt: new Date(),
      },
    });

    await redis.publish(
      `loadtest:status:${config.loadTestId}`,
      JSON.stringify({ status: 'FAILED', stoppedReason: err.message })
    );
  }
}
