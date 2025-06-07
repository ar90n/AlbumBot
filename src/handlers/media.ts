import type { MediaEvent } from '../types/line';
import type { LineClient } from '../services/line';
import { R2MediaStorage, createMediaMetadata } from '../services/storage';

export const sendSuccessReply = async (
  lineClient: LineClient,
  replyToken: string,
  mediaType: 'image' | 'video'
): Promise<void> => {
  try {
    const emoji = mediaType === 'image' ? '📷' : '🎥';
    const typeText = mediaType === 'image' ? '画像' : '動画';

    await lineClient.replyMessage(replyToken, [
      {
        type: 'text',
        text: `${typeText}を保存しました ${emoji}`
      }
    ]);
  } catch (error) {
    console.error('Failed to send success reply:', error);
  }
};

export const sendErrorReply = async (lineClient: LineClient, replyToken: string): Promise<void> => {
  try {
    await lineClient.replyMessage(replyToken, [
      {
        type: 'text',
        text: 'メディアの保存に失敗しました ❌'
      }
    ]);
  } catch (error) {
    console.error('Failed to send error reply:', error);
  }
};

export const processMediaEvent = async (
  event: MediaEvent,
  storage: R2MediaStorage,
  lineClient: LineClient
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

    if (event.replyToken) {
      await sendSuccessReply(lineClient, event.replyToken, metadata.mediaType);
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: 'media_save_error',
        messageId: metadata.messageId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    );

    if (event.replyToken) {
      await sendErrorReply(lineClient, event.replyToken);
    }
  }
};
