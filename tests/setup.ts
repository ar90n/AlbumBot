import { beforeAll } from 'vitest';
import { webcrypto } from 'crypto';

// Polyfill crypto.subtle for Node.js test environment
beforeAll(() => {
  if (!globalThis.crypto) {
    // @ts-expect-error - polyfilling crypto
    globalThis.crypto = webcrypto as Crypto;
  }
});

// TextEncoder/TextDecoder are already available in Node.js 11+
// but we ensure they're available just in case
if (typeof globalThis.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}