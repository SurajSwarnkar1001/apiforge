import { describe, it, expect } from 'vitest';
import { isPrivateIp, validateTargetUrl, SsrfSecurityError } from '../utils/ssrf';

describe('SSRF & DNS Security Firewall', () => {
  it('identifies private IPv4 and link-local addresses correctly', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);
    expect(isPrivateIp('169.254.169.254')).toBe(true); // AWS/GCP metadata
    expect(isPrivateIp('0.0.0.0')).toBe(true);
  });

  it('identifies private IPv6 addresses correctly', () => {
    expect(isPrivateIp('::1')).toBe(true); // IPv6 loopback
    expect(isPrivateIp('fc00::1')).toBe(true); // Unique local
    expect(isPrivateIp('fe80::1')).toBe(true); // Link-local
  });

  it('allows public non-restricted IP addresses', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('93.184.216.34')).toBe(false); // example.com
  });

  it('blocks localhost and loopback hostnames', async () => {
    await expect(validateTargetUrl('http://localhost:3000')).rejects.toThrow(SsrfSecurityError);
    await expect(validateTargetUrl('http://127.0.0.1:8080')).rejects.toThrow(SsrfSecurityError);
  });

  it('rejects unsupported protocols (e.g. file://, ftp://, gopher://)', async () => {
    await expect(validateTargetUrl('file:///etc/passwd')).rejects.toThrow(SsrfSecurityError);
    await expect(validateTargetUrl('ftp://ftp.example.com')).rejects.toThrow(SsrfSecurityError);
  });
});
