export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type DiscoverySource = 'OPENAPI' | 'PLAYWRIGHT' | 'JS_BUNDLE' | 'MANUAL';

export type AuthType = 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC' | 'COOKIE' | 'CUSTOM_HEADER';

export type VerificationMethod = 'DNS_TXT' | 'HTTP_FILE' | 'SELF_DECLARATION';

export type LoadTestPreset = 'SMOKE' | 'LOAD' | 'STRESS' | 'SPIKE' | 'CUSTOM';

export type LoadTestStatus = 'QUEUED' | 'RUNNING' | 'STOPPED' | 'COMPLETED' | 'FAILED';

export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  targetUrl: string;
  normalizedUrl: string;
  isVerified: boolean;
  verificationMethod: VerificationMethod;
  verificationToken: string;
  verificationCheckedAt?: string;
  userId: string;
  endpointCount?: number;
  lastScanAt?: string;
  lastLoadTestAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParameterDefinition {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  example?: string;
  defaultValue?: string;
}

export interface Endpoint {
  id: string;
  projectId: string;
  scanId?: string;
  method: HttpMethod;
  url: string;
  path: string;
  source: DiscoverySource;
  confidence: ConfidenceLevel;
  authRequired: boolean;
  authType: AuthType;
  description?: string;
  tags?: string[];
  queryParameters?: ParameterDefinition[];
  headers?: Record<string, string>;
  requestBody?: Record<string, any> | string;
  responseStatus?: number;
  responseContentType?: string;
  responseSchema?: Record<string, any>;
  isMutation: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScanStrategyResult {
  strategy: 'OPENAPI' | 'PLAYWRIGHT' | 'JS_BUNDLE';
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  endpointsDiscovered: number;
  durationMs: number;
  message?: string;
}

export interface Scan {
  id: string;
  projectId: string;
  status: ScanStatus;
  strategies: ScanStrategyResult[];
  endpointsFound: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
  createdAt: string;
}

export interface ThresholdRule {
  metric: 'http_req_duration_p95' | 'http_req_duration_p99' | 'http_req_duration_avg' | 'http_req_failed' | 'http_req_rate';
  operator: '<' | '<=' | '>' | '>=';
  value: number;
  passed?: boolean;
  actualValue?: number;
}

export interface LoadTestAuthConfig {
  type: AuthType;
  bearerToken?: string;
  apiKeyName?: string;
  apiKeyValue?: string;
  apiKeyLocation?: 'HEADER' | 'QUERY';
  username?: string;
  password?: string;
  cookieName?: string;
  cookieValue?: string;
  customHeaders?: Record<string, string>;
}

export interface LoadTestConfig {
  name: string;
  projectId: string;
  endpointId?: string;
  targetUrl: string;
  method: HttpMethod;
  preset: LoadTestPreset;
  headers?: Record<string, string>;
  queryParameters?: Record<string, string>;
  body?: string;
  authConfig?: LoadTestAuthConfig;
  vus: number;
  durationSeconds: number;
  rampUpSeconds: number;
  steadyStateSeconds: number;
  rampDownSeconds: number;
  thresholds: ThresholdRule[];
}

export interface LoadTest {
  id: string;
  projectId: string;
  endpointId?: string;
  name: string;
  status: LoadTestStatus;
  preset: LoadTestPreset;
  targetUrl: string;
  method: HttpMethod;
  vus: number;
  durationSeconds: number;
  rampUpSeconds: number;
  steadyStateSeconds: number;
  rampDownSeconds: number;
  thresholds: ThresholdRule[];
  stoppedReason?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  projectName?: string;
  endpointPath?: string;
}

export interface HttpStatusDistribution {
  '2xx': number;
  '3xx': number;
  '4xx': number;
  '5xx': number;
  other: number;
}

export interface LoadTestMetric {
  id?: string;
  loadTestId: string;
  timestamp: string;
  vus: number;
  rps: number;
  latencyAvg: number;
  latencyMin: number;
  latencyMax: number;
  latencyP50: number;
  latencyP90: number;
  latencyP95: number;
  latencyP99: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
}

export interface LoadTestResult {
  id: string;
  loadTestId: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgRps: number;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  errorRatePercent: number;
  httpStatusBreakdown: HttpStatusDistribution;
  thresholdsSummary: ThresholdRule[];
  stdoutLog?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  projectId?: string;
  projectName?: string;
  action: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
