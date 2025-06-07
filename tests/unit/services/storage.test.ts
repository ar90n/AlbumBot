import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateMediaKey,
  createMediaMetadata,
  R2MediaStorage
} from '../../../src/services/storage';
import { LineClient } from '../../../src/services/line';

describe('storage service', () => {
  describe('generateMediaKey', () => {
    it('should generate consistent key for same inputs', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const key1 = generateMediaKey('msg123', 'image', date);
      const key2 = generateMediaKey('msg123', 'image', date);
      expect(key1).toBe(key2);
      expect(key1).toBe('image/msg123_2024-01-01T00-00-00-000Z.jpg');
    });

    it('should generate correct key for video', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const key = generateMediaKey('msg456', 'video', date);
      expect(key).toBe('video/msg456_2024-01-01T00-00-00-000Z.mp4');
    });

    it('should use current date if not provided', () => {
      const key = generateMediaKey('msg789', 'image');
      expect(key).toMatch(/^image\/msg789_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.jpg$/);
    });
  });

  describe('createMediaMetadata', () => {
    it('should create immutable metadata object', () => {
      const metadata = createMediaMetadata('msg123', 'image');

      expect(metadata.messageId).toBe('msg123');
      expect(metadata.mediaType).toBe('image');
      expect(metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(metadata.key).toMatch(
        /^image\/msg123_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.jpg$/
      );

      // Test immutability
      expect(() => {
        (metadata as any).messageId = 'different';
      }).toThrow();
    });

    it('should create different metadata for different message IDs', () => {
      const metadata1 = createMediaMetadata('msg123', 'image');
      const metadata2 = createMediaMetadata('msg456', 'image');

      expect(metadata1.messageId).not.toBe(metadata2.messageId);
      expect(metadata1.key).not.toBe(metadata2.key);
    });
  });

  describe('R2MediaStorage', () => {
    let mockBucket: R2Bucket;
    let mockLineClient: LineClient;
    let storage: R2MediaStorage;

    beforeEach(() => {
      mockBucket = {
        put: vi.fn().mockResolvedValue({})
      } as any;

      mockLineClient = {
        getMessageContent: vi.fn().mockResolvedValue(new ReadableStream())
      } as any;

      storage = new R2MediaStorage(mockBucket, mockLineClient);
    });

    it('should save media and return metadata', async () => {
      const metadata = createMediaMetadata('msg123', 'image');
      const result = await storage.saveMedia(metadata);

      expect(result).toBe(metadata); // Same reference
      expect(mockLineClient.getMessageContent).toHaveBeenCalledWith('msg123');
      expect(mockBucket.put).toHaveBeenCalledWith(metadata.key, expect.any(ReadableStream));
    });

    it('should handle null stream gracefully', async () => {
      (mockLineClient.getMessageContent as any).mockResolvedValue(null);

      const metadata = createMediaMetadata('msg123', 'image');
      await expect(storage.saveMedia(metadata)).rejects.toThrow('No media content available');
    });

    it('should propagate LINE client errors', async () => {
      const error = new Error('LINE API error');
      (mockLineClient.getMessageContent as any).mockRejectedValue(error);

      const metadata = createMediaMetadata('msg123', 'image');
      await expect(storage.saveMedia(metadata)).rejects.toThrow('LINE API error');
    });

    it('should propagate R2 storage errors', async () => {
      const error = new Error('R2 storage error');
      (mockBucket.put as any).mockRejectedValue(error);

      const metadata = createMediaMetadata('msg123', 'image');
      await expect(storage.saveMedia(metadata)).rejects.toThrow('R2 storage error');
    });
  });
});
