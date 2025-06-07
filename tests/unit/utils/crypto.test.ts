import { describe, it, expect } from 'vitest';
import { verifySignature, hexToBuffer, generateTestSignature } from '../../../src/utils/crypto';

describe('crypto utilities', () => {
  describe('hexToBuffer', () => {
    it('should convert hex string to ArrayBuffer', () => {
      const hex = '48656c6c6f'; // "Hello" in hex
      const buffer = hexToBuffer(hex);
      const decoder = new TextDecoder();
      const result = decoder.decode(buffer);
      expect(result).toBe('Hello');
    });

    it('should handle empty string', () => {
      const buffer = hexToBuffer('');
      expect(buffer.byteLength).toBe(0);
    });

    it('should handle uppercase hex', () => {
      const hex = '48656C6C6F';
      const buffer = hexToBuffer(hex);
      const decoder = new TextDecoder();
      const result = decoder.decode(buffer);
      expect(result).toBe('Hello');
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signature', async () => {
      const body = '{"events":[]}';
      const secret = 'test-secret';
      const signature = await generateTestSignature(body, secret);

      const result = await verifySignature(body, signature, secret);
      expect(result).toBe(true);
    });

    it('should return false for invalid signature', async () => {
      const result = await verifySignature('body', 'invalid', 'secret');
      expect(result).toBe(false);
    });

    it('should return false for different body with same signature', async () => {
      const body = '{"events":[]}';
      const secret = 'test-secret';
      const signature = await generateTestSignature(body, secret);

      const result = await verifySignature('{"events":["different"]}', signature, secret);
      expect(result).toBe(false);
    });

    it('should return false for same body with different secret', async () => {
      const body = '{"events":[]}';
      const secret = 'test-secret';
      const signature = await generateTestSignature(body, secret);

      const result = await verifySignature(body, signature, 'different-secret');
      expect(result).toBe(false);
    });
  });
});
