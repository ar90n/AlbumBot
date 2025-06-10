/**
 * LINE API Client for Cloudflare Workers
 *
 * Note: We implement our own LINE client instead of using @line/bot-sdk because:
 * 1. The SDK depends on Node.js modules (axios, http, https) not available in Workers
 * 2. Cloudflare Workers use the Fetch API for HTTP requests
 * 3. We only need a subset of the SDK's functionality
 *
 * For signature validation, see src/utils/crypto.ts which implements
 * Web Crypto API-based validation compatible with LINE's base64 signatures.
 */

import type { Env } from '../types/env';

export class LineClient {
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
}

export const createLineClient = (env: Env): LineClient => {
  return new LineClient(env.LINE_CHANNEL_ACCESS_TOKEN);
};
