# Mistral-Worldwide-Hackathon

Mistral-Worldwide-Hackathon用のリポジトリ。 https://luma.com/mistralhack-tokyo?tk=y0lkUf

## 概要

## Live Demo

https://mistral-worldwide-hackathon-fronten.vercel.app

## システムアーキテクチャ

## 機能一覧表

## 機能ごとの処理シーケンス図

## 技術スタック

## 動かし方

### セットアップ

- 依存関係インストール

  ```bash
  pnpm install
  pip3 install -r pkgs/backend/requirements.txt
  ```

- 環境変数のセットアップ

  ```bash
  cp pkgs/backend/.env.example pkgs/backend/.env
  cp pkgs/contract/.env.example pkgs/contract/.env
  ```

`pkgs/contract/.env` には最低限以下を設定:
- `PRIVATE_KEY`
- `ALCHMEY_API_KEY`
- `BASESCAN_API_KEY`

### ZKサーキット

- ビルド

  ```bash
  pnpm --filter circuit compile
  ```

- Inputデータを生成する

  ```bash
  pnpm --filter circuit generateInput
  ```

- ウィットネス生成

  ```bash
  pnpm --filter circuit generateWitness
  ```

- Groth16による一連の動作が機能するかをテスト

  ```bash
  pnpm --filter circuit executeGroth16
  ```

- テスト

  ```bash
  pnpm --filter circuit test
  ```

### バックエンド

- ビルド（ZK成果物を backend に同期）

  ```bash
  pnpm --filter backend zk:copy
  ```

- テスト

  ```bash
  pnpm --filter backend test
  ```

- Dockerコンテナをビルド

  ```bash
  pnpm --filter backend docker:build
  ```

- ローカルでDockerコンテナ起動

  ```bash
  pnpm --filter backend docker:run
  ```

- Cloud Runにデプロイ

  ```bash
  pnpm --filter backend cloudrun:deploy
  ```

- Cloud Runから削除

  ```bash
  pnpm --filter backend cloudrun:cleanup
  ```

### スマートコントラクト

- ビルド

  ```bash
  pnpm --filter contract compile
  ```

- テスト

  ```bash
  pnpm --filter contract test
  ```

- Base Sepoliaへデプロイ

  ```bash
  pnpm --filter contract deploy -- --network base-sepolia
  ```

### MCPサーバー

- ビルド

- テスト

- ローカルで起動

- Cloud Runにデプロイ

- Cloud Runから削除

### フロントエンド

- ビルド

- ローカル起動
