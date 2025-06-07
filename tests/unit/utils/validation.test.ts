import { describe, it, expect } from 'vitest';
import {
  isValidWebhookBody,
  isMediaEvent,
  validateMediaSize,
  MediaType
} from '../../../src/utils/validation';
import type { LineWebhookBody, LineEvent, MessageEvent } from '../../../src/types/line';

describe('validation utilities', () => {
  describe('isValidWebhookBody', () => {
    it('should return true for valid webhook body', () => {
      const body: LineWebhookBody = {
        destination: 'U1234567890abcdef',
        events: []
      };
      expect(isValidWebhookBody(body)).toBe(true);
    });

    it('should return false for missing destination', () => {
      const body = {
        events: []
      };
      expect(isValidWebhookBody(body)).toBe(false);
    });

    it('should return false for missing events', () => {
      const body = {
        destination: 'U1234567890abcdef'
      };
      expect(isValidWebhookBody(body)).toBe(false);
    });

    it('should return false for non-array events', () => {
      const body = {
        destination: 'U1234567890abcdef',
        events: 'not-an-array'
      };
      expect(isValidWebhookBody(body)).toBe(false);
    });

    it('should return false for null body', () => {
      expect(isValidWebhookBody(null)).toBe(false);
    });

    it('should return false for undefined body', () => {
      expect(isValidWebhookBody(undefined)).toBe(false);
    });
  });

  describe('isMediaEvent', () => {
    it('should return true for image message event', () => {
      const event: MessageEvent = {
        type: 'message',
        timestamp: 1234567890,
        source: { type: 'user', userId: 'U1234' },
        message: {
          type: 'image',
          id: 'msg123'
        }
      };
      expect(isMediaEvent(event)).toBe(true);
    });

    it('should return true for video message event', () => {
      const event: MessageEvent = {
        type: 'message',
        timestamp: 1234567890,
        source: { type: 'user', userId: 'U1234' },
        message: {
          type: 'video',
          id: 'msg123'
        }
      };
      expect(isMediaEvent(event)).toBe(true);
    });

    it('should return false for text message event', () => {
      const event: MessageEvent = {
        type: 'message',
        timestamp: 1234567890,
        source: { type: 'user', userId: 'U1234' },
        message: {
          type: 'text',
          id: 'msg123',
          text: 'Hello'
        }
      };
      expect(isMediaEvent(event)).toBe(false);
    });

    it('should return false for non-message event', () => {
      const event: LineEvent = {
        type: 'follow',
        timestamp: 1234567890,
        source: { type: 'user', userId: 'U1234' }
      };
      expect(isMediaEvent(event)).toBe(false);
    });
  });

  describe('validateMediaSize', () => {
    it('should return true for image within size limit', () => {
      const size = 5 * 1024 * 1024; // 5MB
      expect(validateMediaSize(size, MediaType.IMAGE)).toBe(true);
    });

    it('should return false for image exceeding size limit', () => {
      const size = 11 * 1024 * 1024; // 11MB
      expect(validateMediaSize(size, MediaType.IMAGE)).toBe(false);
    });

    it('should return true for video within size limit', () => {
      const size = 100 * 1024 * 1024; // 100MB
      expect(validateMediaSize(size, MediaType.VIDEO)).toBe(true);
    });

    it('should return false for video exceeding size limit', () => {
      const size = 201 * 1024 * 1024; // 201MB
      expect(validateMediaSize(size, MediaType.VIDEO)).toBe(false);
    });

    it('should return true for zero size', () => {
      expect(validateMediaSize(0, MediaType.IMAGE)).toBe(true);
      expect(validateMediaSize(0, MediaType.VIDEO)).toBe(true);
    });

    it('should return false for negative size', () => {
      expect(validateMediaSize(-1, MediaType.IMAGE)).toBe(false);
      expect(validateMediaSize(-1, MediaType.VIDEO)).toBe(false);
    });
  });
});
