# SNS API NestJS回答コード

SNS教材のNestJS + Prismaバックエンド回答コードです。Reactフロントエンドは別リポジトリ `curriculum-react-projects-answer` の `apps/sns` を使います。

このリポジトリはローカルで動く回答コードに絞っています。AWSデプロイ、CDK、ECS、RDSなどのインフラ構築は含めません。

## 構成

```text
curriculum-sns-nestjs-answer/
├── compose.yaml          # PostgreSQL 16（ローカル開発用）
├── prisma/               # Prisma schema / migrations
├── src/                  # NestJS API
├── test/                 # E2E test
└── skills/APP_OVERVIEW.md
```

## ポート

| 役割 | URL |
|---|---|
| API | `http://localhost:3000` |
| PostgreSQL | `localhost:5432` |
| React | `http://localhost:5173` |

Spring版SNS APIは `http://localhost:8000` を使います。React側は `.env` の `VITE_API_URL` で切り替えます。

## 初回セットアップ

```bash
docker compose up -d
pnpm install
cp .env.example .env
pnpm exec prisma migrate dev
```

## 起動

```bash
pnpm run start:dev
```

Reactフロントエンド側:

```bash
cd ../curriculum-react-projects-answer/apps/sns
pnpm install
cp .env.example .env
pnpm run dev
```

ブラウザで `http://localhost:5173/` を開きます。

## ローカルで確認できる機能

- ユーザー登録
- コンソール出力の確認URLによるメール確認
- ログイン
- 投稿作成、一覧、削除
- いいね、いいね解除
- フォロー、フォロー解除
- フォロー中タイムライン
- DMチャット（Socket.IO）
- プロフィール編集

## メール確認

`.env.example` の `MAIL_TRANSPORT="console"` を使うと、実際のメール送信は行いません。登録後、APIサーバーのログに確認URLが表示されます。

```text
http://localhost:5173/#/verify-email?token=...
```

そのURLをブラウザで開くとメール確認が完了します。

## 画像アップロードについて

このリポジトリはローカル開発を優先しています。S3の実バケット作成やデプロイは含めません。プロフィール編集の基本機能はローカルで確認できます。

## テスト

```bash
pnpm run test
pnpm run build
```

E2Eテストを実行する場合:

```bash
docker compose exec db psql -U postgres -c 'CREATE DATABASE sns_test;'
cp .env.test.example .env.test
pnpm exec dotenv -e .env.test -- prisma migrate deploy
pnpm run test:e2e
```

## 開発メモ

- デプロイやインフラ構築はこのリポジトリでは扱いません。
- DBだけDocker Composeで起動し、APIはローカルのNode.jsで実行します。
- Prismaは教材と合わせるため5系に固定しています。
- 現行教材のNestJS版はJWTを `localStorage` に保存する方式です。共通仕様ページでは今後の標準としてHttpOnly Cookie方式を定義しています。

