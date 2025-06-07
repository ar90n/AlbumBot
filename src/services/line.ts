import type { Env } from '../types/env';

export interface ReplyMessage {
  type: string;
  text?: string;
  [key: string]: any;
}

export class LineClient {
  private readonly baseUrl = 'https://api.line.me/v2/bot';
  private readonly dataUrl = 'https://api-data.line.me/v2/bot';

  constructor(private readonly accessToken: string) {}

  async getMessageContent(messageId: string): Promise<ReadableStream | null> {
    const response = await fetch(`${this.dataUrl}/message/${messageId}/content`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get message content: ${response.status}`);
    }

    return response.body;
  }

  async replyMessage(replyToken: string, messages: ReplyMessage[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/message/reply`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replyToken,
        messages
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to reply message: ${response.status}`);
    }
  }
}

export const createLineClient = (env: Env): LineClient => {
  return new LineClient(env.LINE_CHANNEL_ACCESS_TOKEN);
};
