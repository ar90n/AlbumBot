# LINE Album Bot for Cloudflare Workers

LINE Botで送信された画像・動画をCloudflare R2に保存するアルバムボット。

## 機能

- LINE Messaging APIのWebhook受信
- 画像・動画メッセージの自動保存
- Cloudflare R2へのメディアファイル保存
- 保存完了通知の自動返信

## 技術スタック

- **Runtime**: Cloudflare Workers
- **Storage**: Cloudflare R2
- **Language**: TypeScript
- **Test Framework**: Vitest
- **API**: LINE Messaging API

## セットアップ

### 必要な準備

1. Cloudflareアカウント
2. LINE Developersアカウント
3. Node.js 18以上

### 環境構築

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# テストの実行
npm test

# カバレッジレポート
npm run coverage
```

### 環境変数の設定

```bash
# LINE Channel Secret
wrangler secret put LINE_CHANNEL_SECRET

# LINE Channel Access Token
wrangler secret put LINE_CHANNEL_ACCESS_TOKEN
```

### R2バケットの作成

```bash
# R2バケットを作成
wrangler r2 bucket create line-media-storage
```

## デプロイ

```bash
# 本番環境へデプロイ
npm run deploy
```

デプロイ後、LINE DevelopersコンソールでWebhook URLを設定：
```
https://line-album-bot.<your-subdomain>.workers.dev/webhook
```

## 開発

### ディレクトリ構造

```
src/
├── index.ts           # エントリーポイント
├── handlers/
│   ├── webhook.ts     # Webhook処理
│   └── media.ts       # メディア処理
├── services/
│   ├── line.ts        # LINE API クライアント
│   └── storage.ts     # R2ストレージ操作
├── utils/
│   ├── crypto.ts      # 署名検証
│   └── validation.ts  # バリデーション
└── types/
    ├── line.ts        # LINE API型定義
    └── env.ts         # 環境変数型定義
```

### テスト駆動開発

このプロジェクトはTDD（Test-Driven Development）で開発されています。

```bash
# テストの実行
npm test

# ウォッチモード
npm run test:watch

# UIモード
npm run test:ui
```

### コード品質

```bash
# 型チェック
npm run typecheck

# フォーマットチェック
npm run lint

# フォーマット実行
npm run format
```

## CI/CD

GitHub Actionsによる自動化：

- **CI**: プルリクエスト時にテスト、型チェック、セキュリティ監査を実行
- **CD**: main/masterブランチへのプッシュ時に自動デプロイ

### 必要なGitHub Secrets

- `CLOUDFLARE_API_TOKEN`: Cloudflare APIトークン
- `CLOUDFLARE_ACCOUNT_ID`: CloudflareアカウントID
- `LINE_CHANNEL_SECRET`: LINE Channel Secret
- `LINE_CHANNEL_ACCESS_TOKEN`: LINE Channel Access Token

## ライセンス

ISC

## 作者

ar90n