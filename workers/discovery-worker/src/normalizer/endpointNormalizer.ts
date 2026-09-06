import { DiscoveredEndpointData } from '../strategies/openapi.strategy';

/**
 * Deduplicates and normalizes endpoints across multiple discovery strategies.
 * High-confidence OpenAPI entries take precedence over medium and low confidence candidates.
 */
export function normalizeAndDeduplicateEndpoints(
  endpoints: DiscoveredEndpointData[]
): DiscoveredEndpointData[] {
  const map = new Map<string, DiscoveredEndpointData>();

  for (const ep of endpoints) {
    // Normalization key: METHOD + path (ignoring trailing slashes)
    const normalizedPath = ep.path.replace(/\/+$/, '') || '/';
    const key = `${ep.method}:${normalizedPath}`;

    if (!map.has(key)) {
      map.set(key, { ...ep, path: normalizedPath });
    } else {
      const existing = map.get(key)!;
      // Upgrade confidence if higher tier found
      if (ep.confidence === 'HIGH' && existing.confidence !== 'HIGH') {
        map.set(key, { ...ep, path: normalizedPath });
      } else if (ep.confidence === 'MEDIUM' && existing.confidence === 'LOW') {
        map.set(key, { ...ep, path: normalizedPath });
      }
    }
  }

  return Array.from(map.values());
}
