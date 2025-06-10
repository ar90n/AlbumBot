import { describe, it, expect } from 'vitest';
import {
  verifySignature,
  base64ToBuffer,
  bufferToBase64,
  generateTestSignature
} from '../../../src/utils/crypto';

describe('crypto utilities', () => {
  describe('base64ToBuffer', () => {
    it('should convert base64 string to ArrayBuffer', () => {
      const base64 = 'SGVsbG8='; // "Hello" in base64
      const buffer = base64ToBuffer(base64);
      const decoder = new TextDecoder();
      const result = decoder.decode(buffer);
      expect(result).toBe('Hello');
    });

    it('should handle empty string', () => {
      const buffer = base64ToBuffer('');
      expect(buffer.byteLength).toBe(0);
    });
  });

  describe('bufferToBase64', () => {
    it('should convert ArrayBuffer to base64 string', () => {
      const encoder = new TextEncoder();
      const buffer = encoder.encode('Hello').buffer;
      const base64 = bufferToBase64(buffer);
      expect(base64).toBe('SGVsbG8=');
    });

    it('should handle empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      const base64 = bufferToBase64(buffer);
      expect(base64).toBe('');
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
      const result = await verifySignature('body', 'invalid==', 'secret');
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

    it('should handle LINE SDK format signatures', async () => {
      // This is a real example of how LINE sends signatures
      const body = '{"events":[]}';
      const secret = 'test-secret';
      const signature = await generateTestSignature(body, secret);

      // Signature should be in base64 format
      expect(signature).toMatch(/^[A-Za-z0-9+/]*={0,2}$/);
      
      const result = await verifySignature(body, signature, secret);
      expect(result).toBe(true);
    });
  });
});