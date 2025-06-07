import { beforeAll } from 'vitest';
import { webcrypto } from 'crypto';

// Polyfill crypto.subtle for Node.js test environment
beforeAll(() => {
  if (typeof globalThis.crypto === 'undefined') {
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      writable: true,
      configurable: true
    });
  }
});
