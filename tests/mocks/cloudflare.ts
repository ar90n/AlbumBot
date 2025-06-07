import { vi } from 'vitest';
import type { Env } from '../../src/types/env';

export const createMockRequest = (options: {
  body?: string;
  headers?: Record<string, string>;
  method?: string;
  url?: string;
}) => {
  const { body = '', headers = {}, method = 'POST', url = 'https://example.com/webhook' } = options;

  return new Request(url, {
    method,
    headers: new Headers(headers),
    body: method !== 'GET' ? body : undefined
  });
};

export const createMockEnv = (): Env => {
  return {
    LINE_CHANNEL_SECRET: 'test-secret',
    LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
    MEDIA_BUCKET: {
      put: vi.fn().mockResolvedValue({}),
      get: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      head: vi.fn()
    } as any
  };
};

export const createMockExecutionContext = (): ExecutionContext => {
  const waitUntilCalls: Promise<any>[] = [];

  return {
    waitUntil: vi.fn((promise: Promise<any>) => {
      waitUntilCalls.push(promise);
    }),
    passThroughOnException: vi.fn(),
    _waitUntilCalls: waitUntilCalls
  } as any;
};
