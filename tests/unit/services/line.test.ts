import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LineClient } from '../../../src/services/line';
import type { Env } from '../../../src/types/env';

describe('LineClient', () => {
  let lineClient: LineClient;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = {
      LINE_CHANNEL_ACCESS_TOKEN: 'test-token',
      LINE_CHANNEL_SECRET: 'test-secret',
      MEDIA_BUCKET: {} as R2Bucket
    };
    lineClient = new LineClient(mockEnv.LINE_CHANNEL_ACCESS_TOKEN);
  });

  describe('getMessageContent', () => {
    it('should fetch message content with correct headers', async () => {
      const messageId = 'msg123';
      const mockResponse = new Response('media-content', {
        headers: { 'Content-Type': 'image/jpeg' }
      });

      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

      const result = await lineClient.getMessageContent(messageId);

      expect(fetchSpy).toHaveBeenCalledWith(
        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        {
          headers: {
            Authorization: `Bearer ${mockEnv.LINE_CHANNEL_ACCESS_TOKEN}`
          }
        }
      );
      expect(result).toBe(mockResponse.body);
    });

    it('should throw error for failed request', async () => {
      const messageId = 'msg123';
      const mockResponse = new Response('error', { status: 404 });

      vi.spyOn(global, 'fetch').mockResolvedValueOnce(mockResponse);

      await expect(lineClient.getMessageContent(messageId)).rejects.toThrow(
        'Failed to get message content: 404'
      );
    });
  });

  describe('createLineClient', () => {
    it('should create a new LineClient instance', async () => {
      const { createLineClient } = await import('../../../src/services/line');
      const client = createLineClient(mockEnv);

      expect(client).toBeInstanceOf(LineClient);
    });
  });
});
