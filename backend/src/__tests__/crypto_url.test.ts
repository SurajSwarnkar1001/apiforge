import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from '../utils/crypto';
import { normalizeUrl, normalizeEndpointPath } from '../utils/url';

describe('Encryption Utility (AES-256-GCM)', () => {
  it('encrypts and decrypts secrets with integrity', () => {
    const original = 'Bearer secret-jwt-token-production-12345';
    const encrypted = encryptSecret(original);

    expect(encrypted).not.toBe(original);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:cipherText

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(original);
  });
});

describe('URL & Endpoint Normalizer', () => {
  it('normalizes target base URLs', () => {
    expect(normalizeUrl('HTTP://API.EXAMPLE.COM:80/')).toBe('http://api.example.com');
    expect(normalizeUrl('https://api.example.com:443/api/v1/')).toBe('https://api.example.com/api/v1');
    expect(normalizeUrl('api.example.com')).toBe('https://api.example.com');
  });

  it('normalizes dynamic path parameters to templates', () => {
    expect(normalizeEndpointPath('/api/v1/users/58291')).toBe('/api/v1/users/{id}');
    expect(normalizeEndpointPath('/api/v1/orders/a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe('/api/v1/orders/{uuid}');
    expect(normalizeEndpointPath('/api/v1/items/507f1f77bcf86cd799439011')).toBe('/api/v1/items/{hash}');
  });
});
