import dns from 'dns';
import ipaddr from 'ipaddr.js';
import { env } from '../config/env';

export class SsrfSecurityError extends Error {
  public code: string;
  constructor(message: string, code = 'SSRF_VIOLATION') {
    super(message);
    this.name = 'SsrfSecurityError';
    this.code = code;
  }
}

/**
 * Validates whether an IP address is in a private/restricted range
 */
export function isPrivateIp(ipString: string): boolean {
  try {
    const addr = ipaddr.parse(ipString);
    const range = addr.range();

    // Restricted IPv4 and IPv6 ranges
    const blockedRanges = [
      'loopback',
      'private',
      'linkLocal',
      'uniqueLocal',
      'carrierGradeNat',
      'broadcast',
      'reserved',
      'multicast',
      'unspecified',
    ];

    if (blockedRanges.includes(range)) {
      return true;
    }

    // Explicit AWS/GCP/Azure Cloud metadata check
    if (ipString === '169.254.169.254' || ipString === '::ffff:169.254.169.254') {
      return true;
    }

    return false;
  } catch {
    return true; // If IP cannot be parsed, treat as unsafe
  }
}

/**
 * Validates a target URL against SSRF attacks, DNS rebinding, and restricted IP subnets.
 */
export async function validateTargetUrl(rawUrl: string): Promise<{
  safeUrl: string;
  resolvedIps: string[];
  hostname: string;
  port: number;
}> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
  } catch {
    throw new SsrfSecurityError('Malformed or invalid URL provided.', 'INVALID_URL');
  }

  // Enforce HTTP / HTTPS protocols
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new SsrfSecurityError(
      `Unsupported protocol: ${parsed.protocol}. Only HTTP and HTTPS are permitted.`,
      'PROTOCOL_FORBIDDEN'
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost and standard loopback hostnames
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    if (!env.ALLOW_LOCAL_TARGETS) {
      throw new SsrfSecurityError(
        `Target domain '${hostname}' resolves to a local or internal network and is forbidden.`,
        'FORBIDDEN_LOCAL_TARGET'
      );
    }
  }

  // Port restrictions
  const defaultPort = parsed.protocol === 'https:' ? 443 : 80;
  const port = parsed.port ? parseInt(parsed.port, 10) : defaultPort;

  // Resolve DNS to verify all potential A/AAAA records
  let addresses: string[] = [];
  try {
    const lookupResults = await dns.promises.lookup(hostname, { all: true });
    addresses = lookupResults.map((r) => r.address);
  } catch (err: any) {
    throw new SsrfSecurityError(
      `Unable to resolve DNS for hostname '${hostname}': ${err.message}`,
      'DNS_RESOLUTION_FAILED'
    );
  }

  if (addresses.length === 0) {
    throw new SsrfSecurityError(`No IP addresses found for hostname '${hostname}'`, 'NO_IP_FOUND');
  }

  // Check every resolved IP address against the private subnet blacklist
  for (const ip of addresses) {
    if (isPrivateIp(ip)) {
      if (!env.ALLOW_LOCAL_TARGETS) {
        throw new SsrfSecurityError(
          `Target domain '${hostname}' resolves to private/restricted IP '${ip}', which is blocked for security.`,
          'PRIVATE_IP_BLOCKED'
        );
      }
    }
  }

  return {
    safeUrl: parsed.origin + parsed.pathname,
    resolvedIps: addresses,
    hostname,
    port,
  };
}
