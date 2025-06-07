import type { Env } from '../types/env';
import type { LineWebhookBody, LineEvent, MediaEvent } from '../types/line';
import type { LineClient } from '../services/line';
import { verifySignature } from '../utils/crypto';
import { isValidWebhookBody, isMediaEvent } from '../utils/validation';
import { createLineClient } from '../services/line';
import { R2MediaStorage } from '../services/storage';
import { processMediaEvent } from './media';

export const filterMediaEvents = (events: LineEvent[]): MediaEvent[] => {
  return events.filter((event): event is MediaEvent => isMediaEvent(event));
};

export const createMediaTasks = (
  events: MediaEvent[],
  storage: R2MediaStorage,
  lineClient: LineClient
): Promise<any>[] => {
  return events.map(event => processMediaEvent(event, storage, lineClient));
};

export async function handleWebhook(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const signature = request.headers.get('X-Line-Signature') || '';

  if (!signature) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch (error) {
    return new Response('Bad Request', { status: 400 });
  }

  if (!(await verifySignature(body, signature, env.LINE_CHANNEL_SECRET))) {
    return new Response('Unauthorized', { status: 401 });
  }

  let webhookBody: LineWebhookBody;
  try {
    webhookBody = JSON.parse(body);
  } catch (error) {
    return new Response('Bad Request', { status: 400 });
  }

  if (!isValidWebhookBody(webhookBody)) {
    return new Response('Bad Request', { status: 400 });
  }

  const { events } = webhookBody;
  const mediaEvents = filterMediaEvents(events);

  if (mediaEvents.length > 0) {
    const lineClient = createLineClient(env);
    const storage = new R2MediaStorage(env.MEDIA_BUCKET, lineClient);
    const tasks = createMediaTasks(mediaEvents, storage, lineClient);

    ctx.waitUntil(Promise.all(tasks));
  }

  return new Response('OK', { status: 200 });
}
