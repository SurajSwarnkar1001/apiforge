import { chromium } from 'playwright';
import { DiscoveredEndpointData } from './openapi.strategy';
import { HttpMethod } from '@prisma/client';

const STATIC_EXTENSIONS = ['.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ico', '.ttf', '.eot', '.mp4', '.webp'];
const ANALYTICS_DOMAINS = ['google-analytics.com', 'analytics', 'googletagmanager.com', 'mixpanel.com', 'hotjar.com', 'sentry.io', 'segment.io'];

export async function runPlaywrightStrategy(targetUrl: string): Promise<DiscoveredEndpointData[]> {
  const discovered: DiscoveredEndpointData[] = [];
  const observedMap = new Map<string, DiscoveredEndpointData>();

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) APIForge/1.0',
    });

    const page = await context.newPage();

    // Listen to network requests & responses
    page.on('response', async (response) => {
      try {
        const req = response.request();
        const urlStr = req.url();
        const urlObj = new URL(urlStr);

        // Filter out static assets
        const pathname = urlObj.pathname.toLowerCase();
        if (STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return;

        // Filter out analytics
        if (ANALYTICS_DOMAINS.some((domain) => urlObj.hostname.includes(domain))) return;

        // Check if content-type is API-like (json, xml, plain)
        const contentType = (response.headers()['content-type'] || '').toLowerCase();
        const isApiContentType = contentType.includes('json') || contentType.includes('xml') || pathname.includes('/api/') || pathname.includes('/v1/');

        if (isApiContentType) {
          const methodUpper = req.method().toUpperCase();
          if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(methodUpper)) {
            const method = methodUpper as HttpMethod;
            const path = urlObj.pathname;
            const key = `${method}:${path}`;

            if (!observedMap.has(key)) {
              let requestBody: any = undefined;
              const postData = req.postData();
              if (postData) {
                try {
                  requestBody = JSON.parse(postData);
                } catch {
                  requestBody = postData;
                }
              }

              const headers = req.headers();
              const hasAuth = !!(headers['authorization'] || headers['x-api-key']);
              const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

              observedMap.set(key, {
                method,
                url: `${urlObj.origin}${path}`,
                path,
                source: 'PLAYWRIGHT',
                confidence: 'MEDIUM',
                authRequired: hasAuth,
                authType: hasAuth ? 'BEARER' : 'NONE',
                description: `Observed live ${method} request via browser network interception.`,
                tags: ['Observed Traffic'],
                headers: { 'Content-Type': 'application/json' },
                requestBody,
                responseStatus: response.status(),
                responseContentType: contentType,
                isMutation,
              });
            }
          }
        }
      } catch {
        // Ignore single request parsing failure
      }
    });

    // Navigate to target and wait for network idle
    await page.goto(targetUrl, { timeout: 15000, waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForTimeout(3000); // Allow dynamic XHRs to fire

    await browser.close();
  } catch (err: any) {
    if (browser) await browser.close().catch(() => {});
  }

  return Array.from(observedMap.values());
}
