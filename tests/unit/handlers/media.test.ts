import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processMediaEvent } from '../../../src/handlers/media';
import type { MediaEvent } from '../../../src/types/line';
import type { MediaMetadata } from '../../../src/services/storage';
import { R2MediaStorage } from '../../../src/services/storage';

describe('Media Handler', () => {
  let mockStorage: R2MediaStorage;
  let mockEvent: MediaEvent;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    mockStorage = {
      saveMedia: vi.fn()
    } as any;

    mockEvent = {
      type: 'message',
      timestamp: 1234567890,
      source: { type: 'user', userId: 'U1234' },
      replyToken: 'reply123',
      message: {
        type: 'image',
        id: 'msg123'
      }
    };

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('processMediaEvent', () => {
    it('should save media and log success', async () => {
      const mockMetadata: MediaMetadata = {
        messageId: 'msg123',
        mediaType: 'image',
        timestamp: '2024-01-01T00:00:00.000Z',
        key: 'image/msg123_2024-01-01T00-00-00-000Z.jpg'
      };

      (mockStorage.saveMedia as any).mockResolvedValue(mockMetadata);

      await processMediaEvent(mockEvent, mockStorage);

      expect(mockStorage.saveMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg123',
          mediaType: 'image'
        })
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"media_saved"'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"messageId":"msg123"'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"userId":"U1234"'));
    });

    it('should log error when save fails', async () => {
      const error = new Error('Storage error');
      (mockStorage.saveMedia as any).mockRejectedValue(error);

      await processMediaEvent(mockEvent, mockStorage);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"event":"media_save_error"')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"error":"Storage error"')
      );
    });

    it('should handle events without reply token', async () => {
      const eventWithoutReplyToken = {
        ...mockEvent,
        replyToken: undefined
      };

      const mockMetadata: MediaMetadata = {
        messageId: 'msg123',
        mediaType: 'image',
        timestamp: '2024-01-01T00:00:00.000Z',
        key: 'image/msg123_2024-01-01T00-00-00-000Z.jpg'
      };

      (mockStorage.saveMedia as any).mockResolvedValue(mockMetadata);

      await processMediaEvent(eventWithoutReplyToken, mockStorage);

      expect(mockStorage.saveMedia).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"event":"media_saved"'));
    });

    it('should process video messages', async () => {
      const videoEvent: MediaEvent = {
        ...mockEvent,
        message: {
          type: 'video',
          id: 'video123'
        }
      };

      const mockMetadata: MediaMetadata = {
        messageId: 'video123',
        mediaType: 'video',
        timestamp: '2024-01-01T00:00:00.000Z',
        key: 'video/video123_2024-01-01T00-00-00-000Z.mp4'
      };

      (mockStorage.saveMedia as any).mockResolvedValue(mockMetadata);

      await processMediaEvent(videoEvent, mockStorage);

      expect(mockStorage.saveMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'video123',
          mediaType: 'video'
        })
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('"mediaType":"video"'));
    });
  });
});
