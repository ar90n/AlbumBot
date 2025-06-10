import type { MediaEvent } from '../types/line';
import { R2MediaStorage, createMediaMetadata } from '../services/storage';

export const processMediaEvent = async (
  event: MediaEvent,
  storage: R2MediaStorage
): Promise<void> => {
  const metadata = createMediaMetadata(event.message.id, event.message.type as 'image' | 'video');

  try {
    await storage.saveMedia(metadata);

    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'media_saved',
        messageId: metadata.messageId,
        mediaType: metadata.mediaType,
        key: metadata.key,
        userId: event.source.userId
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'media_save_error',
        messageId: metadata.messageId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    );
  }
};
