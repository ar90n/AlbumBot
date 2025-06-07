import { LineClient } from './line';

export interface MediaMetadata {
  readonly messageId: string;
  readonly mediaType: 'image' | 'video';
  readonly timestamp: string;
  readonly key: string;
}

export const generateMediaKey = (
  messageId: string,
  mediaType: 'image' | 'video',
  timestamp: Date = new Date()
): string => {
  const timestampStr = timestamp.toISOString().replace(/[:.]/g, '-');
  const extension = mediaType === 'image' ? 'jpg' : 'mp4';
  return `${mediaType}/${messageId}_${timestampStr}.${extension}`;
};

export const createMediaMetadata = (
  messageId: string,
  mediaType: 'image' | 'video'
): MediaMetadata => {
  const timestamp = new Date().toISOString();
  return Object.freeze({
    messageId,
    mediaType,
    timestamp,
    key: generateMediaKey(messageId, mediaType)
  });
};

export class R2MediaStorage {
  constructor(
    private readonly bucket: R2Bucket,
    private readonly lineClient: LineClient
  ) {}

  async saveMedia(metadata: MediaMetadata): Promise<MediaMetadata> {
    const mediaStream = await this.lineClient.getMessageContent(metadata.messageId);

    if (!mediaStream) {
      throw new Error('No media content available');
    }

    await this.bucket.put(metadata.key, mediaStream);
    return metadata;
  }
}
