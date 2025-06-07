import type { LineWebhookBody, LineEvent, MessageEvent, MediaEvent } from '../types/line';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video'
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

export const isValidWebhookBody = (body: any): body is LineWebhookBody => {
  return (
    body !== null &&
    body !== undefined &&
    typeof body === 'object' &&
    typeof body.destination === 'string' &&
    Array.isArray(body.events)
  );
};

export const isMediaEvent = (event: LineEvent): event is MediaEvent => {
  return (
    event.type === 'message' &&
    'message' in event &&
    (event.message.type === 'image' || event.message.type === 'video')
  );
};

export const validateMediaSize = (size: number, mediaType: MediaType): boolean => {
  if (size < 0) {
    return false;
  }

  const maxSize = mediaType === MediaType.IMAGE ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  return size <= maxSize;
};
