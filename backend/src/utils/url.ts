/**
 * Normalizes URLs by lowercasing scheme/host, stripping default ports, and removing trailing slashes.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const trimmed = rawUrl.trim();
    const lower = trimmed.toLowerCase();
    const hasScheme = lower.startsWith('http://') || lower.startsWith('https://');
    const urlToParse = hasScheme ? trimmed : `https://${trimmed}`;

    const parsed = new URL(urlToParse);
    let host = parsed.hostname.toLowerCase();

    // Omit standard ports
    if (parsed.port) {
      if (
        (parsed.protocol === 'https:' && parsed.port !== '443') ||
        (parsed.protocol === 'http:' && parsed.port !== '80')
      ) {
        host = `${host}:${parsed.port}`;
      }
    }

    let pathname = parsed.pathname.replace(/\/+$/, '');
    if (!pathname) pathname = '';

    return `${parsed.protocol}//${host}${pathname}`;
  } catch {
    return rawUrl.trim().replace(/\/+$/, '');
  }
}

/**
 * Replaces dynamic numeric IDs, hex hashes, or UUID patterns in path with parameterized placeholders
 * e.g. /api/v1/users/58291/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *   -> /api/v1/users/{id}/orders/{uuid}
 */
export function normalizeEndpointPath(path: string): string {
  if (!path) return '/';

  const cleanPath = path.split('?')[0]; // Remove query params
  const segments = cleanPath.split('/').filter(Boolean);

  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  const hexHashRegex = /^[0-9a-fA-F]{24,32}$/;
  const numericIdRegex = /^\d+$/;

  const normalizedSegments = segments.map((seg) => {
    if (uuidRegex.test(seg)) {
      return '{uuid}';
    }
    if (hexHashRegex.test(seg)) {
      return '{hash}';
    }
    if (numericIdRegex.test(seg)) {
      return '{id}';
    }
    return seg;
  });

  return `/${normalizedSegments.join('/')}`;
}
