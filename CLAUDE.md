# LINE Bot Album Migration to Cloudflare Workers

## プロジェクト概要

LINE Botで送信された画像・動画をアルバムとして保存するシステムを、AWS環境からCloudflare Workers環境に移行する。
既存のコードは破棄する。

### 移行前環境
- **インフラ**: AWS (S3, Lambda, API Gateway)
- **言語**: JavaScript
- **リポジトリ**: https://github.com/ar90n/AlbumBot

### 移行後環境
- **インフラ**: Cloudflare (Workers, R2)
- **言語**: TypeScript
- **ランタイム**: Cloudflare Workers (V8 isolates)

## 機能要件

### コア機能
1. LINE Messaging APIのWebhookを受信
2. 画像・動画メッセージを検出
3. メディアファイルをLINEサーバーからダウンロード
4. R2ストレージに保存
5. 保存完了通知をユーザーに送信

### セキュリティ要件
1. LINE署名検証（X-Line-Signature）
2. 環境変数での機密情報管理
3. R2への適切なアクセス制御

## 技術仕様

### Cloudflare Workers設定

```toml
# wrangler.toml
name = "line-album-bot"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[[r2_buckets]]
binding = "MEDIA_BUCKET"
bucket_name = "line-media-storage"

[vars]
# 環境変数（実際の値は wrangler secret で設定）
# LINE_CHANNEL_SECRET = ""
# LINE_CHANNEL_ACCESS_TOKEN = ""
```

### TypeScript設定

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ES2022",
    "lib": ["ES2021"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### プロジェクト構造

```
line-album-bot/
├── src/
│   ├── index.ts           # エントリーポイント
│   ├── handlers/
│   │   ├── webhook.ts     # Webhook処理
│   │   └── media.ts       # メディア処理
│   ├── services/
│   │   ├── line.ts        # LINE API クライアント
│   │   └── storage.ts     # R2ストレージ操作
│   ├── utils/
│   │   ├── crypto.ts      # 署名検証
│   │   └── validation.ts  # バリデーション
│   └── types/
│       ├── line.ts        # LINE API型定義
│       └── env.ts         # 環境変数型定義
├── tests/
├── wrangler.toml
├── package.json
└── tsconfig.json
```

## 実装ガイドライン

### 実装方針

#### TDD（テスト駆動開発）アプローチ
1. **Red**: 失敗するテストを先に書く
2. **Green**: テストを通す最小限の実装
3. **Refactor**: コードの改善

#### Immutabilityとpure functionの重視
- 状態の変更を避け、新しいオブジェクトを返す
- 副作用を最小限に抑え、関数の予測可能性を高める
- 依存性注入によるテスタビリティの向上

### 1. Webhook受信とルーティング

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
```

### 2. LINE署名検証

```typescript
// src/utils/crypto.ts
// Pure functionとして実装
export const verifySignature = async (
  body: string, 
  signature: string, 
  secret: string
): Promise<boolean> => {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signatureBuffer = hexToBuffer(signature);
  const dataBuffer = encoder.encode(body);
  
  return crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer);
};

// テスト例
describe('verifySignature', () => {
  it('should return true for valid signature', async () => {
    const body = '{"events":[]}';
    const secret = 'test-secret';
    const signature = await generateTestSignature(body, secret);
    
    const result = await verifySignature(body, signature, secret);
    expect(result).toBe(true);
  });
  
  it('should return false for invalid signature', async () => {
    const result = await verifySignature('body', 'invalid', 'secret');
    expect(result).toBe(false);
  });
});
```

### 3. メディアダウンロードとR2保存

```typescript
// src/services/storage.ts
// Immutableな設計とpure functionの活用

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

// 副作用を分離したストレージサービス
export class R2MediaStorage {
  constructor(
    private readonly bucket: R2Bucket,
    private readonly lineClient: LineClient
  ) {}
  
  async saveMedia(metadata: MediaMetadata): Promise<MediaMetadata> {
    const mediaStream = await this.lineClient.getMessageContent(metadata.messageId);
    await this.bucket.put(metadata.key, mediaStream);
    return metadata; // 同じimmutableオブジェクトを返す
  }
}

// テスト例
describe('Media Storage', () => {
  describe('generateMediaKey', () => {
    it('should generate consistent key for same inputs', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const key1 = generateMediaKey('msg123', 'image', date);
      const key2 = generateMediaKey('msg123', 'image', date);
      expect(key1).toBe(key2);
      expect(key1).toBe('image/msg123_2024-01-01T00-00-00-000Z.jpg');
    });
  });
  
  describe('R2MediaStorage', () => {
    it('should save media and return metadata', async () => {
      const mockBucket = createMockR2Bucket();
      const mockLineClient = createMockLineClient();
      const storage = new R2MediaStorage(mockBucket, mockLineClient);
      
      const metadata = createMediaMetadata('msg123', 'image');
      const result = await storage.saveMedia(metadata);
      
      expect(result).toBe(metadata); // 同じ参照を返す
      expect(mockBucket.put).toHaveBeenCalledWith(metadata.key, expect.any(ReadableStream));
    });
  });
});
```

### 4. エラーハンドリングとレート制限

```typescript
// Pure functionとしてレート計算
export const calculateRateLimit = (
  currentCount: number,
  limit: number = 100
): { allowed: boolean; remaining: number } => {
  return Object.freeze({
    allowed: currentCount < limit,
    remaining: Math.max(0, limit - currentCount)
  });
};

// 副作用を分離したレート制限サービス
export class RateLimiter {
  constructor(
    private readonly kv: KVNamespace,
    private readonly limit: number = 100
  ) {}
  
  async checkAndIncrement(userId: string): Promise<{ allowed: boolean; remaining: number }> {
    const key = `rate:${userId}`;
    const current = parseInt(await this.kv.get(key) || '0');
    const result = calculateRateLimit(current, this.limit);
    
    if (result.allowed) {
      await this.kv.put(key, String(current + 1), {
        expirationTtl: 86400 // 24時間
      });
    }
    
    return result;
  }
}

// テスト例
describe('Rate Limiting', () => {
  describe('calculateRateLimit', () => {
    it('should allow when under limit', () => {
      const result = calculateRateLimit(50, 100);
      expect(result).toEqual({ allowed: true, remaining: 50 });
    });
    
    it('should deny when at or over limit', () => {
      const result = calculateRateLimit(100, 100);
      expect(result).toEqual({ allowed: false, remaining: 0 });
    });
  });
});
```

## パフォーマンス最適化

### 1. ストリーミング処理
- 大きなメディアファイルはメモリに全体を読み込まない
- ReadableStreamを使用した効率的な転送

### 2. 非同期処理
- Webhook応答は即座に返す
- メディア保存は非同期で実行（ctx.waitUntil使用）

```typescript
// イベント処理をpure functionで実装
export const filterMediaEvents = (events: LineEvent[]): MediaEvent[] => {
  return events.filter(
    (event): event is MediaEvent => 
      event.type === 'message' && 
      (event.message.type === 'image' || event.message.type === 'video')
  );
};

export const createMediaTasks = (
  events: MediaEvent[],
  storage: R2MediaStorage
): Promise<MediaMetadata>[] => {
  return events.map(event => {
    const metadata = createMediaMetadata(
      event.message.id,
      event.message.type as 'image' | 'video'
    );
    return storage.saveMedia(metadata);
  });
};

// ハンドラー実装
export async function handleWebhook(
  request: Request, 
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // 署名検証とイベント解析
  const body = await request.text();
  const signature = request.headers.get('X-Line-Signature') || '';
  
  if (!await verifySignature(body, signature, env.LINE_CHANNEL_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const { events } = JSON.parse(body) as { events: LineEvent[] };
  const mediaEvents = filterMediaEvents(events);
  
  if (mediaEvents.length > 0) {
    const storage = new R2MediaStorage(env.MEDIA_BUCKET, createLineClient(env));
    const tasks = createMediaTasks(mediaEvents, storage);
    
    // 非同期でメディア処理
    ctx.waitUntil(Promise.all(tasks));
  }
  
  // 即座に200 OKを返す
  return new Response('OK', { status: 200 });
}
```

### 3. エッジキャッシング
- 頻繁にアクセスされるメディアはCache APIを活用

## 監視とログ

### 1. Workersログ
```typescript
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  event: 'media_saved',
  messageId,
  mediaType,
  size: contentLength,
  userId
}));
```

### 2. Workers Analytics
- リクエスト数、エラー率、レスポンス時間を監視

### 3. R2メトリクス
- ストレージ使用量、オブジェクト数を定期的に確認

## セキュリティベストプラクティス

1. **環境変数の管理**
   ```bash
   wrangler secret put LINE_CHANNEL_SECRET
   wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
   ```

2. **入力検証**
   - すべての入力データをバリデーション
   - ファイルサイズ制限（画像: 10MB、動画: 200MB）

3. **アクセス制御**
   - R2バケットは非公開設定
   - Workers経由でのみアクセス可能

## デプロイメント手順

1. **開発環境セットアップ**
   ```bash
   npm create cloudflare@latest line-album-bot
   cd line-album-bot
   npm install @line/bot-sdk @cloudflare/workers-types
   npm install -D vitest @vitest/ui c8
   ```

2. **テスト実行**
   ```bash
   npm test          # ユニットテスト
   npm run test:watch # ウォッチモード
   npm run coverage  # カバレッジレポート
   ```

3. **ローカル開発**
   ```bash
   wrangler dev --local
   ```

4. **本番デプロイ**
   ```bash
   npm run test      # テストが全て通ることを確認
   wrangler publish
   ```

5. **LINE Webhook URL設定**
   ```
   https://line-album-bot.{your-subdomain}.workers.dev/webhook
   ```

## テスト戦略

### TDDサイクル
1. **テストファースト**: 機能実装前にテストを書く
2. **最小実装**: テストを通す最小限のコードを書く
3. **リファクタリング**: immutabilityとpure functionの原則に従って改善

### テスト構成
```
tests/
├── unit/
│   ├── utils/
│   │   ├── crypto.test.ts
│   │   └── validation.test.ts
│   ├── services/
│   │   ├── line.test.ts
│   │   └── storage.test.ts
│   └── handlers/
│       ├── webhook.test.ts
│       └── media.test.ts
├── integration/
│   └── webhook-flow.test.ts
└── mocks/
    ├── cloudflare.ts
    └── line-api.ts
```

### テスト例
```typescript
// tests/unit/handlers/webhook.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { handleWebhook } from '../../../src/handlers/webhook';
import { createMockRequest, createMockEnv } from '../../mocks/cloudflare';

describe('Webhook Handler', () => {
  let env: Env;
  
  beforeEach(() => {
    env = createMockEnv();
  });
  
  describe('signature validation', () => {
    it('should reject requests with invalid signature', async () => {
      const request = createMockRequest({
        body: '{"events":[]}',
        headers: { 'X-Line-Signature': 'invalid' }
      });
      
      const response = await handleWebhook(request, env, {} as ExecutionContext);
      
      expect(response.status).toBe(401);
    });
    
    it('should accept requests with valid signature', async () => {
      const body = '{"events":[]}';
      const signature = await generateValidSignature(body, env.LINE_CHANNEL_SECRET);
      const request = createMockRequest({
        body,
        headers: { 'X-Line-Signature': signature }
      });
      
      const response = await handleWebhook(request, env, {} as ExecutionContext);
      
      expect(response.status).toBe(200);
    });
  });
});
```

## 移行チェックリスト

- [ ] Cloudflareアカウントとワーカーの作成
- [ ] R2バケットの作成と設定
- [ ] LINE Messaging API設定の確認
- [ ] 環境変数の設定（Channel Secret, Access Token）
- [ ] TypeScriptプロジェクトの初期化
- [ ] TDDによる実装
  - [ ] ユーティリティ関数のテストと実装
    - [ ] 署名検証（crypto.ts）
    - [ ] バリデーション（validation.ts）
  - [ ] サービス層のテストと実装
    - [ ] LINE APIクライアント（line.ts）
    - [ ] R2ストレージ（storage.ts）
  - [ ] ハンドラーのテストと実装
    - [ ] Webhookハンドラー（webhook.ts）
    - [ ] メディア処理（media.ts）
  - [ ] 統合テストの作成
- [ ] カバレッジ確認（目標: 90%以上）
- [ ] 本番環境へのデプロイ
- [ ] LINE Webhook URLの更新
- [ ] 動作確認
- [ ] 旧環境からのデータ移行（必要に応じて）
- [ ] 監視設定

## 注意事項

1. **Workersの制限**
   - CPU時間: 10ms（無料）/ 50ms（有料）
   - メモリ: 128MB
   - リクエストサイズ: 100MB

2. **R2の制限**
   - オブジェクトサイズ: 最大5TB（ただし、Workersからは100MBまで）
   - 無料枠: 10GB/月のストレージ、100万リクエスト/月

3. **LINE APIの制限**
   - メディアダウンロード: メッセージ受信から一定時間のみ有効
   - APIレート制限に注意