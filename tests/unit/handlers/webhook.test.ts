import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleWebhook } from '../../../src/handlers/webhook';
import {
  createMockRequest,
  createMockEnv,
  createMockExecutionContext
} from '../../mocks/cloudflare';
import { generateTestSignature } from '../../../src/utils/crypto';
import type { Env } from '../../../src/types/env';

describe('Webhook Handler', () => {
  let env: Env;
  let ctx: ExecutionContext;

  beforeEach(() => {
    env = createMockEnv();
    ctx = createMockExecutionContext();
    vi.clearAllMocks();
  });

  describe('signature validation', () => {
    it('should reject requests with invalid signature', async () => {
      const request = createMockRequest({
        body: '{"events":[]}',
        headers: { 'X-Line-Signature': 'invalid' }
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Unauthorized');
    });

    it('should accept requests with valid signature', async () => {
      const body = '{"destination":"U9876","events":[]}';
      const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);
      const request = createMockRequest({
        body,
        headers: { 'X-Line-Signature': signature }
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
    });

    it('should reject requests without signature header', async () => {
      const request = createMockRequest({
        body: '{"events":[]}',
        headers: {}
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(401);
    });
  });

  describe('event processing', () => {
    it('should process image message events', async () => {
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
      const request = createMockRequest({
        body,
        headers: { 'X-Line-Signature': signature }
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(200);
      expect(ctx.waitUntil).toHaveBeenCalled();
    });

    it('should process video message events', async () => {
      const events = [
        {
          type: 'message',
          timestamp: 1234567890,
          source: { type: 'user', userId: 'U1234' },
          replyToken: 'reply123',
          message: {
            type: 'video',
            id: 'msg456',
            duration: 10000
          }
        }
      ];

      const body = JSON.stringify({ destination: 'U9876', events });
      const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);
      const request = createMockRequest({
        body,
        headers: { 'X-Line-Signature': signature }
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(200);
      expect(ctx.waitUntil).toHaveBeenCalled();
    });

    it('should ignore non-media events', async () => {
      const events = [
        {
          type: 'message',
          timestamp: 1234567890,
          source: { type: 'user', userId: 'U1234' },
          message: {
            type: 'text',
            id: 'msg789',
            text: 'Hello'
          }
        }
      ];

      const body = JSON.stringify({ destination: 'U9876', events });
      const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);
      const request = createMockRequest({
        body,
        headers: { 'X-Line-Signature': signature }
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(200);
      expect(ctx.waitUntil).not.toHaveBeenCalled();
    });

    it('should handle multiple media events', async () => {
      const events = [
        {
          type: 'message',
          timestamp: 1234567890,
          source: { type: 'user', userId: 'U1234' },
          replyToken: 'reply123',
          message: { type: 'image', id: 'msg1' }
        },
        {
          type: 'message',
          timestamp: 1234567891,
          source: { type: 'user', userId: 'U1234' },
          replyToken: 'reply124',
          message: { type: 'video', id: 'msg2' }
        }
      ];

      const body = JSON.stringify({ destination: 'U9876', events });
      const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);
      const request = createMockRequest({
        body,
        headers: { 'X-Line-Signature': signature }
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(200);
      expect(ctx.waitUntil).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle invalid JSON body', async () => {
      const body = 'invalid json';
      const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);
      const request = createMockRequest({
        body,
        headers: { 'X-Line-Signature': signature }
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Bad Request');
    });

    it('should handle invalid webhook body structure', async () => {
      const body = '{"not":"valid"}';
      const signature = await generateTestSignature(body, env.LINE_CHANNEL_SECRET);
      const request = createMockRequest({
        body,
        headers: { 'X-Line-Signature': signature }
      });

      const response = await handleWebhook(request, env, ctx);

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Bad Request');
    });
  });
});
