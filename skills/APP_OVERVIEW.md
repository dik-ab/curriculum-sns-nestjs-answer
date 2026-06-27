# SNS NestJSバックエンドの概要

このリポジトリは、SNS教材のNestJS + Prisma回答コードです。

## 機能

- 認証: 登録、ログイン、メール確認、JWT Guard
- 投稿: 作成、一覧、削除
- いいね: 追加、解除、件数表示
- フォロー: フォロー、解除、フォロー中タイムライン
- DM: Socket.IOによるリアルタイムチャット
- プロフィール: 表示名、自己紹介、アバターURL更新

## 技術構成

- NestJS 10
- Prisma 5
- PostgreSQL 16（Docker Compose）
- Socket.IO
- Jest / Supertest

## 起動

1. `docker compose up -d`
2. `pnpm install`
3. `cp .env.example .env`
4. `pnpm exec prisma migrate dev`
5. `pnpm run start:dev`

APIは `http://localhost:3000` で起動します。

## ローカル確認

- メール送信は `MAIL_TRANSPORT=console` にすると、確認URLがサーバーログに出ます。
- AWSデプロイやCDKはこの回答リポジトリの対象外です。
- アバター画像アップロードのS3実送信は応用扱いです。ローカルでSNS主要機能を確認する場合はプロフィールテキスト更新まで確認します。

