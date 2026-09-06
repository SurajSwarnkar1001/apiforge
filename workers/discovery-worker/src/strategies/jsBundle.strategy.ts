import axios from 'axios';
import * as cheerio from 'cheerio';
import { DiscoveredEndpointData } from './openapi.strategy';
import { HttpMethod } from '@prisma/client';

const API_PATH_REGEX = /["'`](\/(?:api|v[0-9]|graphql|auth|users|products|checkout|orders)\/[a-zA-Z0-9_\-\/{}]*)["'`]/g;

export async function runJsBundleStrategy(targetUrl: string): Promise<DiscoveredEndpointData[]> {
  const discovered: DiscoveredEndpointData[] = [];
  const candidatePaths = new Set<string>();

  try {
    const origin = new URL(targetUrl).origin;

    // 1. Fetch HTML to find script tags
    const htmlRes = await axios.get(targetUrl, { timeout: 8000 });
    const $ = cheerio.load(htmlRes.data);

    const scriptUrls: string[] = [];
    $('script[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src) {
        if (src.startsWith('http')) {
          scriptUrls.push(src);
        } else if (src.startsWith('//')) {
          scriptUrls.push(`https:${src}`);
        } else if (src.startsWith('/')) {
          scriptUrls.push(`${origin}${src}`);
        } else {
          scriptUrls.push(`${origin}/${src}`);
        }
      }
    });

    // 2. Fetch up to 5 main JS script chunks
    for (const sUrl of scriptUrls.slice(0, 5)) {
      try {
        const jsRes = await axios.get(sUrl, { timeout: 6000 });
        if (typeof jsRes.data === 'string') {
          let match;
          while ((match = API_PATH_REGEX.exec(jsRes.data)) !== null) {
            const path = match[1];
            if (path && path.length > 3 && !path.includes('.js') && !path.includes('.css')) {
              candidatePaths.add(path);
            }
          }
        }
      } catch {
        // Skip unreadable bundles
      }
    }

    for (const path of candidatePaths) {
      discovered.push({
        method: 'GET' as HttpMethod,
        url: `${origin}${path}`,
        path,
        source: 'JS_BUNDLE',
        confidence: 'LOW',
        authRequired: false,
        authType: 'NONE',
        description: 'Candidate route detected inside client JavaScript bundle.',
        tags: ['Client Bundle'],
        responseStatus: 200,
        responseContentType: 'application/json',
        isMutation: false,
      });
    }
  } catch {
    // Fail gracefully
  }

  return discovered;
}
