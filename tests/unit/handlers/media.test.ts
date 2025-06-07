import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processMediaEvent, sendSuccessReply, sendErrorReply } from '../../../src/handlers/media';
import type { MediaEvent } from '../../../src/types/line';
import type { MediaMetadata } from '../../../src/services/storage';
import { LineClient } from '../../../src/services/line';
import { R2MediaStorage } from '../../../src/services/storage';

describe('Media Handler', () => {
  let mockLineClient: LineClient;
  let mockStorage: R2MediaStorage;
  let mockEvent: MediaEvent;

  beforeEach(() => {
    mockLineClient = {
      replyMessage: vi.fn().mockResolvedValue(undefined),
      getMessageContent: vi.fn()
    } as any;

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
  });

  describe('processMediaEvent', () => {
    it('should save media and send success reply', async () => {
      const mockMetadata: MediaMetadata = {
        messageId: 'msg123',
        mediaType: 'image',
        timestamp: '2024-01-01T00:00:00.000Z',
        key: 'image/msg123_2024-01-01T00-00-00-000Z.jpg'
      };

      (mockStorage.saveMedia as any).mockResolvedValue(mockMetadata);

      await processMediaEvent(mockEvent, mockStorage, mockLineClient);

      expect(mockStorage.saveMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          messageId: 'msg123',
          mediaType: 'image'
        })
      );

      expect(mockLineClient.replyMessage).toHaveBeenCalledWith(
        'reply123',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('保存しました')
          })
        ])
      );
    });

    it('should send error reply when save fails', async () => {
      const error = new Error('Storage error');
      (mockStorage.saveMedia as any).mockRejectedValue(error);

      await processMediaEvent(mockEvent, mockStorage, mockLineClient);

      expect(mockLineClient.replyMessage).toHaveBeenCalledWith(
        'reply123',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'text',
            text: expect.stringContaining('保存に失敗しました')
          })
        ])
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

      await processMediaEvent(eventWithoutReplyToken, mockStorage, mockLineClient);

      expect(mockStorage.saveMedia).toHaveBeenCalled();
      expect(mockLineClient.replyMessage).not.toHaveBeenCalled();
    });
  });

  describe('sendSuccessReply', () => {
    it('should send success message for image', async () => {
      await sendSuccessReply(mockLineClient, 'reply123', 'image');

      expect(mockLineClient.replyMessage).toHaveBeenCalledWith('reply123', [
        { type: 'text', text: '画像を保存しました 📷' }
      ]);
    });

    it('should send success message for video', async () => {
      await sendSuccessReply(mockLineClient, 'reply123', 'video');

      expect(mockLineClient.replyMessage).toHaveBeenCalledWith('reply123', [
        { type: 'text', text: '動画を保存しました 🎥' }
      ]);
    });

    it('should handle reply errors gracefully', async () => {
      const error = new Error('Reply failed');
      (mockLineClient.replyMessage as any).mockRejectedValue(error);

      // Should not throw
      await expect(sendSuccessReply(mockLineClient, 'reply123', 'image')).resolves.not.toThrow();
    });
  });

  describe('sendErrorReply', () => {
    it('should send error message', async () => {
      await sendErrorReply(mockLineClient, 'reply123');

      expect(mockLineClient.replyMessage).toHaveBeenCalledWith('reply123', [
        { type: 'text', text: 'メディアの保存に失敗しました ❌' }
      ]);
    });

    it('should handle reply errors gracefully', async () => {
      const error = new Error('Reply failed');
      (mockLineClient.replyMessage as any).mockRejectedValue(error);

      // Should not throw
      await expect(sendErrorReply(mockLineClient, 'reply123')).resolves.not.toThrow();
    });
  });
});
