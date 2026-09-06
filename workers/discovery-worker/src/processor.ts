import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { runOpenApiStrategy } from './strategies/openapi.strategy';
import { runPlaywrightStrategy } from './strategies/playwright.strategy';
import { runJsBundleStrategy } from './strategies/jsBundle.strategy';
import { normalizeAndDeduplicateEndpoints } from './normalizer/endpointNormalizer';

const prisma = new PrismaClient();

export interface DiscoveryJobData {
  scanId: string;
  projectId: string;
  targetUrl: string;
  strategies?: string[];
}

export async function processDiscoveryJob(job: Job<DiscoveryJobData>) {
  const { scanId, projectId, targetUrl, strategies = ['OPENAPI', 'PLAYWRIGHT', 'JS_BUNDLE'] } = job.data;

  console.log(`[Discovery Worker] Starting discovery scan ${scanId} for target ${targetUrl}`);

  let allDiscovered: any[] = [];
  const strategyResults: any[] = [];

  // Strategy 1: OpenAPI
  if (strategies.includes('OPENAPI')) {
    const start = Date.now();
    try {
      const openApiEndpoints = await runOpenApiStrategy(targetUrl);
      allDiscovered.push(...openApiEndpoints);
      strategyResults.push({
        strategy: 'OPENAPI',
        status: 'SUCCESS',
        endpointsDiscovered: openApiEndpoints.length,
        durationMs: Date.now() - start,
        message: `Parsed OpenAPI specification with ${openApiEndpoints.length} endpoints`,
      });
    } catch (err: any) {
      strategyResults.push({
        strategy: 'OPENAPI',
        status: 'FAILED',
        endpointsDiscovered: 0,
        durationMs: Date.now() - start,
        message: err.message,
      });
    }
  }

  // Strategy 2: Playwright
  if (strategies.includes('PLAYWRIGHT')) {
    const start = Date.now();
    try {
      const playwrightEndpoints = await runPlaywrightStrategy(targetUrl);
      allDiscovered.push(...playwrightEndpoints);
      strategyResults.push({
        strategy: 'PLAYWRIGHT',
        status: 'SUCCESS',
        endpointsDiscovered: playwrightEndpoints.length,
        durationMs: Date.now() - start,
        message: `Observed ${playwrightEndpoints.length} active API requests via headless browser`,
      });
    } catch (err: any) {
      strategyResults.push({
        strategy: 'PLAYWRIGHT',
        status: 'FAILED',
        endpointsDiscovered: 0,
        durationMs: Date.now() - start,
        message: err.message,
      });
    }
  }

  // Strategy 3: JS Bundle
  if (strategies.includes('JS_BUNDLE')) {
    const start = Date.now();
    try {
      const jsEndpoints = await runJsBundleStrategy(targetUrl);
      allDiscovered.push(...jsEndpoints);
      strategyResults.push({
        strategy: 'JS_BUNDLE',
        status: 'SUCCESS',
        endpointsDiscovered: jsEndpoints.length,
        durationMs: Date.now() - start,
        message: `Extracted ${jsEndpoints.length} candidate routes from client script bundles`,
      });
    } catch (err: any) {
      strategyResults.push({
        strategy: 'JS_BUNDLE',
        status: 'FAILED',
        endpointsDiscovered: 0,
        durationMs: Date.now() - start,
        message: err.message,
      });
    }
  }

  // Normalize and deduplicate
  const deduplicated = normalizeAndDeduplicateEndpoints(allDiscovered);

  // Persist endpoints to PostgreSQL via Prisma
  for (const ep of deduplicated) {
    try {
      await prisma.endpoint.upsert({
        where: {
          projectId_method_path: {
            projectId,
            method: ep.method,
            path: ep.path,
          },
        },
        update: {
          confidence: ep.confidence,
          authRequired: ep.authRequired,
          authType: ep.authType,
          description: ep.description,
          tags: ep.tags,
          queryParameters: ep.queryParameters,
          headers: ep.headers,
          requestBody: ep.requestBody,
          isMutation: ep.isMutation,
          scanId,
        },
        create: {
          projectId,
          scanId,
          method: ep.method,
          url: ep.url,
          path: ep.path,
          source: ep.source,
          confidence: ep.confidence,
          authRequired: ep.authRequired,
          authType: ep.authType,
          description: ep.description,
          tags: ep.tags,
          queryParameters: ep.queryParameters,
          headers: ep.headers,
          requestBody: ep.requestBody,
          responseStatus: ep.responseStatus,
          responseContentType: ep.responseContentType,
          isMutation: ep.isMutation,
        },
      });
    } catch (e) {
      console.error(`Failed to upsert endpoint ${ep.method} ${ep.path}:`, e);
    }
  }

  // Update scan summary
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: 'COMPLETED',
      strategies: strategyResults,
      endpointsFound: deduplicated.length,
      completedAt: new Date(),
    },
  });

  console.log(`[Discovery Worker] Scan ${scanId} completed. Discovered & normalized ${deduplicated.length} endpoints.`);
  return { endpointsDiscovered: deduplicated.length };
}
