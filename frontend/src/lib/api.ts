import axios, { AxiosError } from 'axios';
import { Project, Endpoint, LoadTest, LoadTestResult, LoadTestMetric, Scan, AuditLog, LoadTestConfig } from '../types';
import { mockProjects, mockEndpoints, mockScans, mockLoadTests, mockLoadTestResult, generateMockMetricsTimeSeries, mockAuditLogs, mockCurrentUser } from './mock-data';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor for JWT auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('apiforge_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// In-memory state for mock client fallback
let inMemoryProjects = [...mockProjects];
let inMemoryEndpoints = [...mockEndpoints];
let inMemoryScans = [...mockScans];
let inMemoryLoadTests = [...mockLoadTests];
let inMemoryAuditLogs = [...mockAuditLogs];

export const api = {
  // Auth
  async getCurrentUser() {
    try {
      const res = await apiClient.get('/auth/me');
      return res.data;
    } catch {
      return mockCurrentUser;
    }
  },

  async login(email: string, _password?: string) {
    try {
      const res = await apiClient.post('/auth/login', { email, password: _password });
      if (res.data.token) {
        localStorage.setItem('apiforge_token', res.data.token);
      }
      return res.data;
    } catch {
      localStorage.setItem('apiforge_token', 'mock_token_123');
      return { token: 'mock_token_123', user: { ...mockCurrentUser, email } };
    }
  },

  logout() {
    localStorage.removeItem('apiforge_token');
  },

  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const res = await apiClient.get('/projects');
      return res.data.data;
    } catch {
      return inMemoryProjects;
    }
  },

  async getProject(id: string): Promise<Project> {
    try {
      const res = await apiClient.get(`/projects/${id}`);
      return res.data.data;
    } catch {
      const p = inMemoryProjects.find((x) => x.id === id);
      if (!p) throw new Error('Project not found');
      return p;
    }
  },

  async createProject(data: { name: string; targetUrl: string; verificationMethod?: string }): Promise<Project> {
    try {
      const res = await apiClient.post('/projects', data);
      return res.data.data;
    } catch {
      const newProj: Project = {
        id: `proj_${Date.now()}`,
        name: data.name,
        targetUrl: data.targetUrl,
        normalizedUrl: data.targetUrl.replace(/\/+$/, ''),
        isVerified: false,
        verificationMethod: (data.verificationMethod as any) || 'DNS_TXT',
        verificationToken: `apiforge-verify-${Math.random().toString(36).substring(2, 10)}`,
        userId: mockCurrentUser.id,
        endpointCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      inMemoryProjects.unshift(newProj);
      return newProj;
    }
  },

  async verifyProject(id: string, method: string): Promise<{ success: boolean; isVerified: boolean; message: string }> {
    try {
      const res = await apiClient.post(`/projects/${id}/verify`, { method });
      return res.data;
    } catch {
      const proj = inMemoryProjects.find((p) => p.id === id);
      if (proj) {
        proj.isVerified = true;
        proj.verificationMethod = method as any;
        proj.verificationCheckedAt = new Date().toISOString();
      }
      return { success: true, isVerified: true, message: 'Target ownership verified successfully.' };
    }
  },

  // Scans & Discovery
  async startScan(projectId: string, strategies?: string[]): Promise<Scan> {
    try {
      const res = await apiClient.post(`/projects/${projectId}/scan`, { strategies });
      return res.data.data;
    } catch {
      const newScan: Scan = {
        id: `scan_${Date.now()}`,
        projectId,
        status: 'RUNNING',
        strategies: [
          { strategy: 'OPENAPI', status: 'RUNNING', endpointsDiscovered: 0, durationMs: 0 },
          { strategy: 'PLAYWRIGHT', status: 'PENDING', endpointsDiscovered: 0, durationMs: 0 },
          { strategy: 'JS_BUNDLE', status: 'PENDING', endpointsDiscovered: 0, durationMs: 0 },
        ],
        endpointsFound: 0,
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      inMemoryScans.unshift(newScan);
      return newScan;
    }
  },

  async getScan(projectId: string, scanId: string): Promise<Scan> {
    try {
      const res = await apiClient.get(`/projects/${projectId}/scan/${scanId}`);
      return res.data.data;
    } catch {
      const s = inMemoryScans.find((x) => x.id === scanId);
      if (!s) return mockScans[0];
      return s;
    }
  },

  // Endpoints
  async getEndpoints(projectId?: string): Promise<Endpoint[]> {
    try {
      const url = projectId ? `/projects/${projectId}/endpoints` : '/endpoints';
      const res = await apiClient.get(url);
      return res.data.data;
    } catch {
      if (projectId) {
        return inMemoryEndpoints.filter((e) => e.projectId === projectId);
      }
      return inMemoryEndpoints;
    }
  },

  async getEndpoint(id: string): Promise<Endpoint> {
    try {
      const res = await apiClient.get(`/endpoints/${id}`);
      return res.data.data;
    } catch {
      const ep = inMemoryEndpoints.find((e) => e.id === id);
      if (!ep) throw new Error('Endpoint not found');
      return ep;
    }
  },

  async executeSingleRequest(endpointId: string, options: { headers?: Record<string, string>; queryParams?: Record<string, string>; body?: any }): Promise<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    durationMs: number;
  }> {
    try {
      const res = await apiClient.post(`/endpoints/${endpointId}/execute`, options);
      return res.data;
    } catch (err: any) {
      // Mock execution response
      return {
        status: 200,
        statusText: 'OK',
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-ratelimit-remaining': '98',
          'x-response-time': '128ms',
        },
        data: {
          success: true,
          count: 2,
          results: [
            { id: 'prod_9921', name: 'Quantum Core Mechanical Keyboard', price: 149.99, inStock: true },
            { id: 'prod_9922', name: 'AeroGlide Wireless Precision Mouse', price: 89.50, inStock: true },
          ],
        },
        durationMs: 134,
      };
    }
  },

  // Load Tests
  async createLoadTest(config: LoadTestConfig): Promise<{ jobId: string; status: string; loadTest: LoadTest }> {
    try {
      const res = await apiClient.post('/load-tests', config);
      return res.data;
    } catch {
      const newLt: LoadTest = {
        id: `lt_${Date.now()}`,
        projectId: config.projectId,
        endpointId: config.endpointId,
        name: config.name,
        status: 'RUNNING',
        preset: config.preset,
        targetUrl: config.targetUrl,
        method: config.method,
        vus: config.vus,
        durationSeconds: config.durationSeconds,
        rampUpSeconds: config.rampUpSeconds,
        steadyStateSeconds: config.steadyStateSeconds,
        rampDownSeconds: config.rampDownSeconds,
        thresholds: config.thresholds,
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        projectName: inMemoryProjects.find((p) => p.id === config.projectId)?.name,
        endpointPath: inMemoryEndpoints.find((e) => e.id === config.endpointId)?.path,
      };
      inMemoryLoadTests.unshift(newLt);
      return { jobId: `job_${Date.now()}`, status: 'queued', loadTest: newLt };
    }
  },

  async getLoadTests(projectId?: string): Promise<LoadTest[]> {
    try {
      const url = projectId ? `/projects/${projectId}/load-tests` : '/load-tests';
      const res = await apiClient.get(url);
      return res.data.data;
    } catch {
      if (projectId) {
        return inMemoryLoadTests.filter((t) => t.projectId === projectId);
      }
      return inMemoryLoadTests;
    }
  },

  async getLoadTest(id: string): Promise<LoadTest> {
    try {
      const res = await apiClient.get(`/load-tests/${id}`);
      return res.data.data;
    } catch {
      const lt = inMemoryLoadTests.find((t) => t.id === id);
      if (!lt) return mockLoadTests[0];
      return lt;
    }
  },

  async stopLoadTest(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post(`/load-tests/${id}/stop`);
      return res.data;
    } catch {
      const lt = inMemoryLoadTests.find((t) => t.id === id);
      if (lt) {
        lt.status = 'STOPPED';
        lt.stoppedReason = 'Manually terminated by user';
        lt.endedAt = new Date().toISOString();
      }
      return { success: true, message: 'Load test process terminated successfully.' };
    }
  },

  async getLoadTestResults(id: string): Promise<LoadTestResult> {
    try {
      const res = await apiClient.get(`/load-tests/${id}/results`);
      return res.data.data;
    } catch {
      return {
        ...mockLoadTestResult,
        loadTestId: id,
      };
    }
  },

  async getLoadTestMetrics(id: string): Promise<LoadTestMetric[]> {
    try {
      const res = await apiClient.get(`/load-tests/${id}/metrics`);
      return res.data.data;
    } catch {
      return generateMockMetricsTimeSeries(30);
    }
  },

  // Audit Logs
  async getAuditLogs(projectId?: string): Promise<AuditLog[]> {
    try {
      const url = projectId ? `/projects/${projectId}/audit-logs` : '/audit-logs';
      const res = await apiClient.get(url);
      return res.data.data;
    } catch {
      if (projectId) {
        return inMemoryAuditLogs.filter((a) => a.projectId === projectId);
      }
      return inMemoryAuditLogs;
    }
  },
};
