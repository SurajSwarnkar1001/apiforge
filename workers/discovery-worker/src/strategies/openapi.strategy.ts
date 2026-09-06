import axios from 'axios';
import { HttpMethod } from '@prisma/client';

export interface DiscoveredEndpointData {
  method: HttpMethod;
  url: string;
  path: string;
  source: 'OPENAPI' | 'PLAYWRIGHT' | 'JS_BUNDLE' | 'MANUAL';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  authRequired: boolean;
  authType: 'NONE' | 'BEARER' | 'API_KEY' | 'BASIC' | 'COOKIE' | 'CUSTOM_HEADER';
  description?: string;
  tags?: string[];
  queryParameters?: any[];
  headers?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseContentType?: string;
  isMutation: boolean;
}

const COMMON_OPENAPI_PATHS = [
  '/openapi.json',
  '/swagger.json',
  '/api-docs',
  '/swagger/v1/swagger.json',
  '/v3/api-docs',
  '/v2/api-docs',
  '/api/openapi.json',
  '/api/swagger.json',
];

export async function runOpenApiStrategy(baseUrl: string): Promise<DiscoveredEndpointData[]> {
  const discovered: DiscoveredEndpointData[] = [];
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  for (const path of COMMON_OPENAPI_PATHS) {
    const docUrl = `${cleanBaseUrl}${path}`;
    try {
      const res = await axios.get(docUrl, {
        timeout: 6000,
        headers: { Accept: 'application/json, text/plain, */*' },
        validateStatus: (status) => status === 200,
      });

      if (res.data && (res.data.openapi || res.data.swagger || res.data.paths)) {
        const spec = res.data;
        const paths = spec.paths || {};

        for (const [routePath, pathObj] of Object.entries<any>(paths)) {
          for (const [methodRaw, op] of Object.entries<any>(pathObj)) {
            const methodUpper = methodRaw.toUpperCase();
            if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(methodUpper)) {
              continue;
            }

            const method = methodUpper as HttpMethod;
            const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

            // Extract query parameters
            const queryParams = (op.parameters || [])
              .filter((p: any) => p.in === 'query')
              .map((p: any) => ({
                name: p.name,
                type: p.schema?.type || p.type || 'string',
                required: !!p.required,
                description: p.description,
                example: p.example || p.schema?.example,
                defaultValue: p.default || p.schema?.default,
              }));

            // Check security
            const hasSecurity = (op.security && op.security.length > 0) || (spec.security && spec.security.length > 0);
            let authType: any = 'NONE';
            if (hasSecurity) {
              authType = 'BEARER';
            }

            discovered.push({
              method,
              url: `${cleanBaseUrl}${routePath.startsWith('/') ? routePath : '/' + routePath}`,
              path: routePath.startsWith('/') ? routePath : `/${routePath}`,
              source: 'OPENAPI',
              confidence: 'HIGH',
              authRequired: hasSecurity,
              authType,
              description: op.summary || op.description,
              tags: op.tags || [],
              queryParameters: queryParams,
              headers: { Accept: 'application/json' },
              requestBody: op.requestBody?.content?.['application/json']?.example || undefined,
              responseStatus: 200,
              responseContentType: 'application/json',
              isMutation,
            });
          }
        }

        // Successfully found and parsed an OpenAPI doc
        break;
      }
    } catch {
      // Continue searching next common location
    }
  }

  return discovered;
}
