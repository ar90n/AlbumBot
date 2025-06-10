/**
 * LINE Webhook Types
 *
 * These types are compatible with @line/bot-sdk but defined here for
 * Cloudflare Workers compatibility. The structure matches LINE's official
 * webhook event types.
 */

export interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

export type LineEvent = MessageEvent | FollowEvent | UnfollowEvent | PostbackEvent;

export interface BaseEvent {
  type: string;
  timestamp: number;
  source: EventSource;
  replyToken?: string;
}

export interface MessageEvent extends BaseEvent {
  type: 'message';
  message: Message;
}

export interface FollowEvent extends BaseEvent {
  type: 'follow';
}

export interface UnfollowEvent extends BaseEvent {
  type: 'unfollow';
}

export interface PostbackEvent extends BaseEvent {
  type: 'postback';
  postback: {
    data: string;
  };
}

export type Message =
  | TextMessage
  | ImageMessage
  | VideoMessage
  | AudioMessage
  | FileMessage
  | LocationMessage
  | StickerMessage;

export interface TextMessage {
  type: 'text';
  id: string;
  text: string;
}

export interface ImageMessage {
  type: 'image';
  id: string;
  contentProvider?: ContentProvider;
}

export interface VideoMessage {
  type: 'video';
  id: string;
  duration?: number;
  contentProvider?: ContentProvider;
}

export interface AudioMessage {
  type: 'audio';
  id: string;
  duration?: number;
  contentProvider?: ContentProvider;
}

export interface FileMessage {
  type: 'file';
  id: string;
  fileName: string;
  fileSize: number;
}

export interface LocationMessage {
  type: 'location';
  id: string;
  title?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface StickerMessage {
  type: 'sticker';
  id: string;
  packageId: string;
  stickerId: string;
}

export interface ContentProvider {
  type: 'line' | 'external';
  originalContentUrl?: string;
  previewImageUrl?: string;
}

export interface EventSource {
  type: 'user' | 'group' | 'room';
  userId?: string;
  groupId?: string;
  roomId?: string;
}

export type MediaEvent = MessageEvent & {
  message: ImageMessage | VideoMessage;
};
