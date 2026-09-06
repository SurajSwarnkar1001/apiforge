import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding APIForge database...');

  // 1. Create Default Admin User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('password123', salt);

  const user = await prisma.user.upsert({
    where: { email: 'alex.developer@apiforge.io' },
    update: {},
    create: {
      id: 'usr_forge_001',
      email: 'alex.developer@apiforge.io',
      name: 'Alex Vance',
      passwordHash,
      role: 'ADMIN',
    },
  });

  console.log(`Created user: ${user.email}`);

  // 2. Create Project
  const project = await prisma.project.upsert({
    where: { id: 'proj_ecommerce_01' },
    update: {},
    create: {
      id: 'proj_ecommerce_01',
      name: 'Novastone E-Commerce API',
      targetUrl: 'https://api.novastore-demo.io',
      normalizedUrl: 'https://api.novastore-demo.io',
      isVerified: true,
      verificationMethod: 'DNS_TXT',
      verificationToken: 'apiforge-verify-8f921a9c4b72',
      verificationCheckedAt: new Date(),
      userId: user.id,
    },
  });

  // 3. Create Discovered Endpoints
  const ep1 = await prisma.endpoint.upsert({
    where: {
      projectId_method_path: {
        projectId: project.id,
        method: 'GET',
        path: '/api/v1/products',
      },
    },
    update: {},
    create: {
      id: 'ep_novastore_01',
      projectId: project.id,
      method: 'GET',
      url: 'https://api.novastore-demo.io/api/v1/products',
      path: '/api/v1/products',
      source: 'OPENAPI',
      confidence: 'HIGH',
      authRequired: false,
      authType: 'NONE',
      description: 'Retrieve paginated catalog products with category, price range, and sorting filters.',
      tags: ['Catalog', 'Products'],
      queryParameters: [
        { name: 'category', type: 'string', required: false, example: 'electronics' },
        { name: 'limit', type: 'integer', required: false, defaultValue: '20' },
        { name: 'page', type: 'integer', required: false, defaultValue: '1' },
      ],
      headers: { Accept: 'application/json' },
      responseStatus: 200,
      responseContentType: 'application/json',
      isMutation: false,
    },
  });

  const ep2 = await prisma.endpoint.upsert({
    where: {
      projectId_method_path: {
        projectId: project.id,
        method: 'POST',
        path: '/api/v1/cart/items',
      },
    },
    update: {},
    create: {
      id: 'ep_novastore_03',
      projectId: project.id,
      method: 'POST',
      url: 'https://api.novastore-demo.io/api/v1/cart/items',
      path: '/api/v1/cart/items',
      source: 'PLAYWRIGHT',
      confidence: 'MEDIUM',
      authRequired: true,
      authType: 'BEARER',
      description: 'Add product variant item and quantity to authenticated user cart session.',
      tags: ['Cart', 'Checkout'],
      headers: { 'Content-Type': 'application/json' },
      requestBody: { productId: 'prod_9921', quantity: 2 },
      responseStatus: 201,
      responseContentType: 'application/json',
      isMutation: true,
    },
  });

  // 4. Create Historical Load Test & Result
  const loadTest = await prisma.loadTest.upsert({
    where: { id: 'lt_catalog_stress_02' },
    update: {},
    create: {
      id: 'lt_catalog_stress_02',
      projectId: project.id,
      endpointId: ep1.id,
      name: 'Product Catalog - Peak Flash Sale Stress Test',
      status: 'COMPLETED',
      preset: 'STRESS',
      targetUrl: 'https://api.novastore-demo.io/api/v1/products',
      method: 'GET',
      vus: 150,
      durationSeconds: 120,
      rampUpSeconds: 20,
      steadyStateSeconds: 80,
      rampDownSeconds: 20,
      thresholds: [
        { metric: 'http_req_duration_p95', operator: '<', value: 500, passed: true, actualValue: 384 },
        { metric: 'http_req_duration_p99', operator: '<', value: 1000, passed: false, actualValue: 1240 },
        { metric: 'http_req_failed', operator: '<', value: 0.02, passed: true, actualValue: 0.008 },
      ],
      startedAt: new Date(Date.now() - 3600000),
      endedAt: new Date(Date.now() - 3480000),
    },
  });

  await prisma.loadTestResult.upsert({
    where: { loadTestId: loadTest.id },
    update: {},
    create: {
      id: 'res_catalog_stress_02',
      loadTestId: loadTest.id,
      totalRequests: 28450,
      successfulRequests: 28222,
      failedRequests: 228,
      avgRps: 237.08,
      avgLatencyMs: 218.4,
      minLatencyMs: 32.1,
      maxLatencyMs: 1840.5,
      p50Ms: 165.2,
      p90Ms: 310.8,
      p95Ms: 384.2,
      p99Ms: 1240.6,
      errorRatePercent: 0.80,
      httpStatusBreakdown: { '2xx': 28222, '3xx': 0, '4xx': 180, '5xx': 48, other: 0 },
      thresholdsSummary: [
        { metric: 'http_req_duration_p95', operator: '<', value: 500, passed: true, actualValue: 384 },
        { metric: 'http_req_duration_p99', operator: '<', value: 1000, passed: false, actualValue: 1240 },
        { metric: 'http_req_failed', operator: '<', value: 0.02, passed: true, actualValue: 0.008 },
      ],
      stdoutLog: 'scenarios: (100.00%) 1 scenario, 150 max VUs, 2m0s duration\nchecks: 98.42% ✓ 55988 ✗ 898\n',
    },
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
