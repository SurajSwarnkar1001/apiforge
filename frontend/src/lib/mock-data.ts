import { Project, Endpoint, LoadTest, LoadTestResult, LoadTestMetric, Scan, AuditLog, User } from '../types';

export const mockCurrentUser: User = {
  id: 'usr_forge_001',
  email: 'alex.developer@apiforge.io',
  name: 'Alex Vance',
  role: 'ADMIN',
  createdAt: '2026-01-15T08:00:00.000Z',
};

export const mockProjects: Project[] = [
  {
    id: 'proj_ecommerce_01',
    name: 'Novastone E-Commerce API',
    targetUrl: 'https://api.novastore-demo.io',
    normalizedUrl: 'https://api.novastore-demo.io',
    isVerified: true,
    verificationMethod: 'DNS_TXT',
    verificationToken: 'apiforge-verify-8f921a9c4b72',
    verificationCheckedAt: '2026-03-01T10:00:00Z',
    userId: 'usr_forge_001',
    endpointCount: 18,
    lastScanAt: '2026-03-05T14:20:00Z',
    lastLoadTestAt: '2026-03-05T15:30:00Z',
    createdAt: '2026-02-10T12:00:00Z',
    updatedAt: '2026-03-05T15:30:00Z',
  },
  {
    id: 'proj_fintech_02',
    name: 'ApexPay Payment Gateway',
    targetUrl: 'https://gateway.apexpay-sandbox.com',
    normalizedUrl: 'https://gateway.apexpay-sandbox.com',
    isVerified: true,
    verificationMethod: 'HTTP_FILE',
    verificationToken: 'apiforge-verify-2d4e8c1a99f0',
    verificationCheckedAt: '2026-03-02T11:30:00Z',
    userId: 'usr_forge_001',
    endpointCount: 12,
    lastScanAt: '2026-03-04T09:15:00Z',
    lastLoadTestAt: '2026-03-04T11:00:00Z',
    createdAt: '2026-02-18T16:00:00Z',
    updatedAt: '2026-03-04T11:00:00Z',
  },
  {
    id: 'proj_health_03',
    name: 'MediSync Telehealth Platform',
    targetUrl: 'https://staging.medisync-care.org',
    normalizedUrl: 'https://staging.medisync-care.org',
    isVerified: false,
    verificationMethod: 'SELF_DECLARATION',
    verificationToken: 'apiforge-verify-77b3d18e24c5',
    userId: 'usr_forge_001',
    endpointCount: 6,
    lastScanAt: '2026-03-05T08:00:00Z',
    createdAt: '2026-03-05T07:45:00Z',
    updatedAt: '2026-03-05T08:00:00Z',
  },
];

export const mockEndpoints: Endpoint[] = [
  {
    id: 'ep_novastore_01',
    projectId: 'proj_ecommerce_01',
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
      { name: 'category', type: 'string', required: false, example: 'electronics', description: 'Filter by category slug' },
      { name: 'limit', type: 'integer', required: false, defaultValue: '20', description: 'Items per page (max 100)' },
      { name: 'page', type: 'integer', required: false, defaultValue: '1', description: 'Page offset number' },
      { name: 'sort', type: 'string', required: false, defaultValue: 'popularity_desc', description: 'Sort criteria' },
    ],
    headers: {
      'Accept': 'application/json',
      'X-Client-Version': '2.4.0',
    },
    responseStatus: 200,
    responseContentType: 'application/json',
    isMutation: false,
    createdAt: '2026-03-05T14:20:00Z',
    updatedAt: '2026-03-05T14:20:00Z',
  },
  {
    id: 'ep_novastore_02',
    projectId: 'proj_ecommerce_01',
    method: 'GET',
    url: 'https://api.novastore-demo.io/api/v1/products/{id}',
    path: '/api/v1/products/{id}',
    source: 'OPENAPI',
    confidence: 'HIGH',
    authRequired: false,
    authType: 'NONE',
    description: 'Retrieve full product metadata, variants, inventory availability, and media gallery.',
    tags: ['Catalog', 'Products'],
    queryParameters: [
      { name: 'id', type: 'string', required: true, example: 'prod_9921', description: 'Product unique identifier' },
    ],
    headers: {
      'Accept': 'application/json',
    },
    responseStatus: 200,
    responseContentType: 'application/json',
    isMutation: false,
    createdAt: '2026-03-05T14:20:00Z',
    updatedAt: '2026-03-05T14:20:00Z',
  },
  {
    id: 'ep_novastore_03',
    projectId: 'proj_ecommerce_01',
    method: 'POST',
    url: 'https://api.novastore-demo.io/api/v1/cart/items',
    path: '/api/v1/cart/items',
    source: 'PLAYWRIGHT',
    confidence: 'MEDIUM',
    authRequired: true,
    authType: 'BEARER',
    description: 'Add product variant item and quantity to authenticated user cart session.',
    tags: ['Cart', 'Checkout'],
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer <token>',
    },
    requestBody: {
      productId: 'prod_9921',
      variantId: 'var_blue_large',
      quantity: 2,
    },
    responseStatus: 201,
    responseContentType: 'application/json',
    isMutation: true,
    createdAt: '2026-03-05T14:21:00Z',
    updatedAt: '2026-03-05T14:21:00Z',
  },
  {
    id: 'ep_novastore_04',
    projectId: 'proj_ecommerce_01',
    method: 'POST',
    url: 'https://api.novastore-demo.io/api/v1/checkout/orders',
    path: '/api/v1/checkout/orders',
    source: 'OPENAPI',
    confidence: 'HIGH',
    authRequired: true,
    authType: 'BEARER',
    description: 'Create a finalized order and initialize payment settlement intent.',
    tags: ['Checkout', 'Orders'],
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer <token>',
      'Idempotency-Key': 'idem-test-9901',
    },
    requestBody: {
      cartId: 'cart_81920',
      shippingAddressId: 'addr_3301',
      paymentMethodId: 'pm_card_visa',
    },
    responseStatus: 201,
    responseContentType: 'application/json',
    isMutation: true,
    createdAt: '2026-03-05T14:22:00Z',
    updatedAt: '2026-03-05T14:22:00Z',
  },
  {
    id: 'ep_novastore_05',
    projectId: 'proj_ecommerce_01',
    method: 'GET',
    url: 'https://api.novastore-demo.io/api/v1/user/profile',
    path: '/api/v1/user/profile',
    source: 'PLAYWRIGHT',
    confidence: 'MEDIUM',
    authRequired: true,
    authType: 'BEARER',
    description: 'Fetch current authenticated user profile, saved addresses, and active membership perks.',
    tags: ['User', 'Auth'],
    headers: {
      'Authorization': 'Bearer <token>',
    },
    responseStatus: 200,
    responseContentType: 'application/json',
    isMutation: false,
    createdAt: '2026-03-05T14:22:30Z',
    updatedAt: '2026-03-05T14:22:30Z',
  },
  {
    id: 'ep_novastore_06',
    projectId: 'proj_ecommerce_01',
    method: 'POST',
    url: 'https://api.novastore-demo.io/graphql',
    path: '/graphql',
    source: 'JS_BUNDLE',
    confidence: 'LOW',
    authRequired: false,
    authType: 'NONE',
    description: 'Discovered GraphQL endpoint found in bundle chunks.',
    tags: ['GraphQL'],
    headers: {
      'Content-Type': 'application/json',
    },
    requestBody: {
      query: 'query { storeConfig { currency taxIncluded locale } }',
    },
    responseStatus: 200,
    responseContentType: 'application/json',
    isMutation: false,
    createdAt: '2026-03-05T14:23:00Z',
    updatedAt: '2026-03-05T14:23:00Z',
  },
];

export const mockScans: Scan[] = [
  {
    id: 'scan_001_novastore',
    projectId: 'proj_ecommerce_01',
    status: 'COMPLETED',
    strategies: [
      { strategy: 'OPENAPI', status: 'SUCCESS', endpointsDiscovered: 12, durationMs: 680, message: 'Discovered OpenAPI 3.0 specification at /openapi.json' },
      { strategy: 'PLAYWRIGHT', status: 'SUCCESS', endpointsDiscovered: 4, durationMs: 4200, message: 'Observed active network XHR/Fetch API calls via headless Chromium' },
      { strategy: 'JS_BUNDLE', status: 'SUCCESS', endpointsDiscovered: 2, durationMs: 1100, message: 'Extracted candidate API routes from 6 bundled JS scripts' },
    ],
    endpointsFound: 18,
    startedAt: '2026-03-05T14:19:40Z',
    completedAt: '2026-03-05T14:20:00Z',
    createdAt: '2026-03-05T14:19:40Z',
  },
];

export const mockLoadTests: LoadTest[] = [
  {
    id: 'lt_catalog_smoke_01',
    projectId: 'proj_ecommerce_01',
    endpointId: 'ep_novastore_01',
    name: 'Product Catalog - Smoke Baseline Test',
    status: 'COMPLETED',
    preset: 'SMOKE',
    targetUrl: 'https://api.novastore-demo.io/api/v1/products',
    method: 'GET',
    vus: 10,
    durationSeconds: 30,
    rampUpSeconds: 5,
    steadyStateSeconds: 20,
    rampDownSeconds: 5,
    thresholds: [
      { metric: 'http_req_duration_p95', operator: '<', value: 300, passed: true, actualValue: 142 },
      { metric: 'http_req_failed', operator: '<', value: 0.01, passed: true, actualValue: 0.002 },
    ],
    startedAt: '2026-03-05T15:29:30Z',
    endedAt: '2026-03-05T15:30:00Z',
    createdAt: '2026-03-05T15:29:00Z',
    projectName: 'Novastone E-Commerce API',
    endpointPath: '/api/v1/products',
  },
  {
    id: 'lt_catalog_stress_02',
    projectId: 'proj_ecommerce_01',
    endpointId: 'ep_novastore_01',
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
    startedAt: '2026-03-05T16:00:00Z',
    endedAt: '2026-03-05T16:02:00Z',
    createdAt: '2026-03-05T15:58:00Z',
    projectName: 'Novastone E-Commerce API',
    endpointPath: '/api/v1/products',
  },
  {
    id: 'lt_active_test_live',
    projectId: 'proj_ecommerce_01',
    endpointId: 'ep_novastore_02',
    name: 'Product Details - Live High-Concurrency Spike',
    status: 'RUNNING',
    preset: 'SPIKE',
    targetUrl: 'https://api.novastore-demo.io/api/v1/products/prod_9921',
    method: 'GET',
    vus: 80,
    durationSeconds: 60,
    rampUpSeconds: 10,
    steadyStateSeconds: 40,
    rampDownSeconds: 10,
    thresholds: [
      { metric: 'http_req_duration_p95', operator: '<', value: 400, passed: true, actualValue: 210 },
      { metric: 'http_req_failed', operator: '<', value: 0.01, passed: true, actualValue: 0.001 },
    ],
    startedAt: new Date(Date.now() - 25000).toISOString(),
    createdAt: new Date(Date.now() - 30000).toISOString(),
    projectName: 'Novastone E-Commerce API',
    endpointPath: '/api/v1/products/{id}',
  },
];

export const mockLoadTestResult: LoadTestResult = {
  id: 'res_catalog_stress_02',
  loadTestId: 'lt_catalog_stress_02',
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
  httpStatusBreakdown: {
    '2xx': 28222,
    '3xx': 0,
    '4xx': 180,
    '5xx': 48,
    other: 0,
  },
  thresholdsSummary: [
    { metric: 'http_req_duration_p95', operator: '<', value: 500, passed: true, actualValue: 384 },
    { metric: 'http_req_duration_p99', operator: '<', value: 1000, passed: false, actualValue: 1240 },
    { metric: 'http_req_failed', operator: '<', value: 0.02, passed: true, actualValue: 0.008 },
  ],
  stdoutLog: `
          /\      |‾‾| /‾‾/   /‾‾/   
     /\  /  \     |  |/  /   /  /    
    /  \/    \    |     (   /   ‾‾\  
   /          \   |  |\  \ |  (‾)  | 
  / __________ \  |__| \__\ \_____/ .io

  execution: local
     script: k6-generated-script.js
     output: json-stream (stdout)

  scenarios: (100.00%) 1 scenario, 150 max VUs, 2m0s max duration (ramping-vus):
           * default: 150 target for 2m0s [3 stages]

  ✓ status is 200
  ✓ response time < 500ms
  ✗ response time < 1000ms (p99 breached under peak load)

  checks.........................: 98.42% ✓ 55988 ✗ 898
  data_received..................: 184 MB  1.53 MB/s
  data_sent......................: 4.8 MB  40 kB/s
  http_req_blocked...............: avg=1.2ms    min=0.01ms med=0.4ms  max=32.1ms p(90)=2.1ms  p(95)=3.8ms 
  http_req_connecting............: avg=0.8ms    min=0.00ms med=0.2ms  max=28.4ms p(90)=1.4ms  p(95)=2.6ms 
  http_req_duration..............: avg=218.4ms  min=32.1ms med=165.2ms max=1840.5ms p(90)=310.8ms p(95)=384.2ms p(99)=1240.6ms
  http_req_failed................: 0.80%  ✓ 228   ✗ 28222
  http_reqs......................: 28450   237.08/s
  iteration_duration.............: avg=620.1ms  min=432.8ms med=570.4ms max=2410.2ms
  vus............................: 0      min=0   max=150
  vus_max........................: 150    min=150 max=150
`,
  createdAt: '2026-03-05T16:02:05Z',
};

export const generateMockMetricsTimeSeries = (count: number = 30): LoadTestMetric[] => {
  const list: LoadTestMetric[] = [];
  const now = Date.now();
  let totalReqs = 0;
  let totalFail = 0;

  for (let i = count; i >= 0; i--) {
    const timestamp = new Date(now - i * 1000).toISOString();
    const progress = (count - i) / count;
    // Ramping VUs curve
    const vus = Math.round(10 + Math.sin(progress * Math.PI) * 70);
    const rps = Math.round(vus * (2.8 + Math.random() * 0.6));
    const latencyAvg = Math.round(140 + vus * 0.9 + Math.random() * 25);
    const latencyP50 = Math.round(latencyAvg * 0.85);
    const latencyP90 = Math.round(latencyAvg * 1.35);
    const latencyP95 = Math.round(latencyAvg * 1.6);
    const latencyP99 = Math.round(latencyAvg * 2.2 + (vus > 60 ? 250 : 0));
    
    const errorsInSec = Math.random() < 0.3 ? Math.round(Math.random() * 3) : 0;
    const successInSec = Math.max(0, rps - errorsInSec);
    
    totalReqs += rps;
    totalFail += errorsInSec;

    list.push({
      loadTestId: 'lt_active_test_live',
      timestamp,
      vus,
      rps,
      latencyAvg,
      latencyMin: 35,
      latencyMax: latencyP99 + 80,
      latencyP50,
      latencyP90,
      latencyP95,
      latencyP99,
      errorRate: parseFloat(((errorsInSec / Math.max(1, rps)) * 100).toFixed(2)),
      totalRequests: totalReqs,
      successfulRequests: totalReqs - totalFail,
      failedRequests: totalFail,
      status2xx: successInSec,
      status4xx: Math.round(errorsInSec * 0.7),
      status5xx: Math.round(errorsInSec * 0.3),
    });
  }
  return list;
};

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'aud_001',
    userId: 'usr_forge_001',
    userName: 'Alex Vance',
    projectId: 'proj_ecommerce_01',
    projectName: 'Novastone E-Commerce API',
    action: 'LOAD_TEST_STARTED',
    ipAddress: '198.51.100.42',
    details: { preset: 'STRESS', vus: 150, durationSeconds: 120, endpoint: '/api/v1/products' },
    createdAt: '2026-03-05T16:00:00Z',
  },
  {
    id: 'aud_002',
    userId: 'usr_forge_001',
    userName: 'Alex Vance',
    projectId: 'proj_ecommerce_01',
    projectName: 'Novastone E-Commerce API',
    action: 'DISCOVERY_SCAN_TRIGGERED',
    ipAddress: '198.51.100.42',
    details: { strategies: ['OPENAPI', 'PLAYWRIGHT', 'JS_BUNDLE'], targetUrl: 'https://api.novastore-demo.io' },
    createdAt: '2026-03-05T14:19:40Z',
  },
  {
    id: 'aud_003',
    userId: 'usr_forge_001',
    userName: 'Alex Vance',
    projectId: 'proj_ecommerce_01',
    projectName: 'Novastone E-Commerce API',
    action: 'PROJECT_VERIFIED',
    ipAddress: '198.51.100.42',
    details: { method: 'DNS_TXT', token: 'apiforge-verify-8f921a9c4b72' },
    createdAt: '2026-03-01T10:00:00Z',
  },
];
