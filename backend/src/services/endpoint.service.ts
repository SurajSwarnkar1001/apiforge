import { PrismaClient, HttpMethod } from '@prisma/client';
import axios from 'axios';
import { validateTargetUrl } from '../utils/ssrf';
import { logger } from '../utils/logger';

export class EndpointService {
  constructor(private prisma: PrismaClient) {}

  async listEndpoints(projectId?: string) {
    return this.prisma.endpoint.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: [{ path: 'asc' }, { method: 'asc' }],
    });
  }

  async getEndpoint(id: string) {
    return this.prisma.endpoint.findUnique({ where: { id } });
  }

  async executeSingleRequest(endpointId: string, options: { headers?: Record<string, string>; queryParams?: Record<string, string>; body?: any }) {
    const endpoint = await this.prisma.endpoint.findUnique({
      where: { id: endpointId },
      include: { project: true },
    });

    if (!endpoint) throw new Error('Endpoint not found');

    // Build URL with query params
    const urlObj = new URL(endpoint.url);
    if (options.queryParams) {
      Object.entries(options.queryParams).forEach(([k, v]) => {
        if (k && v !== undefined) {
          urlObj.searchParams.set(k, String(v));
        }
      });
    }

    // SSRF Check on target URL
    await validateTargetUrl(urlObj.toString());

    const startTime = Date.now();
    try {
      const response = await axios({
        method: endpoint.method.toLowerCase() as any,
        url: urlObj.toString(),
        headers: options.headers || {},
        data: options.body,
        timeout: 10000,
        validateStatus: () => true, // Don't throw on 4xx/5xx
      });

      const durationMs = Date.now() - startTime;

      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers as Record<string, string>,
        data: response.data,
        durationMs,
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      return {
        status: 502,
        statusText: 'Gateway Error',
        headers: {},
        data: { error: err.message || 'Target could not be reached' },
        durationMs,
      };
    }
  }
}
