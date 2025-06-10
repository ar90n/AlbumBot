import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from '../../src/index';
import { generateTestSignature } from '../../src/utils/crypto';
import { createMockEnv, createMockExecutionContext } from '../mocks/cloudflare';
import type { Env } from '../../src/types/env';

describe('Webhook Integration Tests', () => {
  let env: Env;
  let ctx: ExecutionContext;

  beforeEach(() => {
    env = createMockEnv();
    ctx = createMockExecutionContext();
    vi.clearAllMocks();

    // Mock fetch for LINE API calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('api-data.line.me')) {
        return Promise.resolve(
          new Response(new ReadableStream(), {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' }
          })
        );
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  it('should process image message end-to-end', async () => {
    const events = [
      {
        type: 'message',
        timestamp: 1234567890,
        source: { type: 'user', userId: 'U1234' },
        replyToken: 'reply123',
        message: {
          type: 'image',
          id: 'msg123'
        }
      }
    ];

    const body = JSON.stringify({ destination: 'U9876', events });
    const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);

    const request = new Request('https://example.com/webhook', {
      method: 'POST',
      headers: {
        'X-Line-Signature': signature,
        'Content-Type': 'application/json'
      },
      body
    });

    const response = await worker.fetch(request, env, ctx);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');

    // Verify waitUntil was called
    expect(ctx.waitUntil).toHaveBeenCalledTimes(1);

    // Wait for async tasks
    const waitUntilCalls = (ctx as any)._waitUntilCalls;
    await Promise.all(waitUntilCalls);

    // Verify R2 storage was called
    expect(env.MEDIA_BUCKET.put).toHaveBeenCalledWith(
      expect.stringMatching(/^image\/msg123_.*\.jpg$/),
      expect.any(ReadableStream)
    );
  });

  it('should process video message end-to-end', async () => {
    const events = [
      {
        type: 'message',
        timestamp: 1234567890,
        source: { type: 'user', userId: 'U1234' },
        replyToken: 'reply456',
        message: {
          type: 'video',
          id: 'msg456',
          duration: 10000
        }
      }
    ];

    const body = JSON.stringify({ destination: 'U9876', events });
    const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);

    const request = new Request('https://example.com/webhook', {
      method: 'POST',
      headers: {
        'X-Line-Signature': signature,
        'Content-Type': 'application/json'
      },
      body
    });

    const response = await worker.fetch(request, env, ctx);

    expect(response.status).toBe(200);

    // Wait for async tasks
    const waitUntilCalls = (ctx as any)._waitUntilCalls;
    await Promise.all(waitUntilCalls);

    // Verify R2 storage was called with video path
    expect(env.MEDIA_BUCKET.put).toHaveBeenCalledWith(
      expect.stringMatching(/^video\/msg456_.*\.mp4$/),
      expect.any(ReadableStream)
    );
  });

  it('should handle multiple media messages in one webhook', async () => {
    const events = [
      {
        type: 'message',
        timestamp: 1234567890,
        source: { type: 'user', userId: 'U1234' },
        replyToken: 'reply1',
        message: { type: 'image', id: 'msg1' }
      },
      {
        type: 'message',
        timestamp: 1234567891,
        source: { type: 'user', userId: 'U1234' },
        message: { type: 'text', id: 'msg2', text: 'Hello' }
      },
      {
        type: 'message',
        timestamp: 1234567892,
        source: { type: 'user', userId: 'U1234' },
        replyToken: 'reply3',
        message: { type: 'video', id: 'msg3' }
      }
    ];

    const body = JSON.stringify({ destination: 'U9876', events });
    const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);

    const request = new Request('https://example.com/webhook', {
      method: 'POST',
      headers: {
        'X-Line-Signature': signature,
        'Content-Type': 'application/json'
      },
      body
    });

    const response = await worker.fetch(request, env, ctx);

    expect(response.status).toBe(200);

    // Wait for async tasks
    const waitUntilCalls = (ctx as any)._waitUntilCalls;
    await Promise.all(waitUntilCalls);

    // Should save 2 media files (image and video, not text)
    expect(env.MEDIA_BUCKET.put).toHaveBeenCalledTimes(2);
  });

  it('should return 404 for non-webhook endpoints', async () => {
    const request = new Request('https://example.com/other', {
      method: 'GET'
    });

    const response = await worker.fetch(request, env, ctx);

    expect(response.status).toBe(404);
    expect(await response.text()).toBe('Not Found');
  });

  it('should return health check response', async () => {
    const request = new Request('https://example.com/health', {
      method: 'GET'
    });

    const response = await worker.fetch(request, env, ctx);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('OK');
  });

  it('should reject invalid signature', async () => {
    const body = JSON.stringify({ destination: 'U9876', events: [] });

    const request = new Request('https://example.com/webhook', {
      method: 'POST',
      headers: {
        'X-Line-Signature': 'invalid-signature',
        'Content-Type': 'application/json'
      },
      body
    });

    const response = await worker.fetch(request, env, ctx);

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('Unauthorized');
  });
});
