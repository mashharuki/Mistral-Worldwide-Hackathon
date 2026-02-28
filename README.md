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
  pnpm --filter contract run compile
  ```

- テスト

  ```bash
  pnpm --filter contract run test
  ```

- デプロイ（Hardhat Ignition）

  ```bash
  # Verifier + WalletFactory を一括デプロイ
  pnpm --filter contract run deploy --network base-sepolia

  # VoiceCommitmentVerifier を単体デプロイ
  pnpm --filter contract run deploy:commitmentVerifier --network base-sepolia

  # VoiceWallet（Proxy 初期化込み）デプロイ
  # VoiceWalletDeployment の Verifier を自動参照し、未デプロイなら同時にデプロイ
  pnpm --filter contract run deploy:walletProxy \
    --network base-sepolia \
    --parameters '{"VoiceWalletProxyDeployment": {"owner": "0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072", "commitment": "0x9f4d6e3b8c2a7d1e5f0b3a9c4e8d2f6a7b1c0d3e5f9a2b4c6d8e1f3a5b7c9d00"}}'

  # MockERC20 をデプロイ（テスト用）
  pnpm --filter contract run deploy:mockERC20 --network base-sepolia
  ```

- タスク（Hardhat Task）を使う

  > `--verifier` は省略可能です。省略時は `ignition/deployments/chain-{chainId}/deployed_addresses.json` から `contractJsonHelper` が自動解決します。明示的に指定すればそちらが優先されます。

  ```bash
  # チェーン情報 / 残高確認
  pnpm --filter contract run getChainInfo --network base-sepolia
  pnpm --filter contract run getBalance --network base-sepolia

  # Wallet 情報取得（walletは deployed_addresses.json から自動解決）
  pnpm --filter contract exec hardhat walletInfo \
    --network base-sepolia

  # ETH / ERC20 送金（wallet / token は deployed_addresses.json から自動解決）
  pnpm --filter contract exec hardhat walletEthTransfer \
    --to 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072 \
    --amount 0.001 \
    --network base-sepolia

  pnpm --filter contract exec hardhat walletErc20Transfer \
    --to 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072 \
    --amount 1 \
    --network base-sepolia

  # EntryPoint への deposit 入出金
  pnpm --filter contract exec hardhat walletAddDeposit \
    --amount 0.01 \
    --network base-sepolia

  pnpm --filter contract exec hardhat walletWithdrawDeposit \
    --to 0x51908F598A5e0d8F1A3bAbFa6DF76F9704daD072 \
    --amount 0.005 \
    --network base-sepolia

  # 必要なら手動アドレスを上書き可能
  # --wallet 0x... / --token 0x...

  # 証明検証（proof は JSON 文字列）
  # --verifier 省略時は deployed_addresses.json から自動取得
  pnpm --filter contract exec hardhat verifyProof \
    --proof '{"a":["1","2"],"b":[["3","4"],["5","6"]],"c":["7","8"],"input":["9"]}' \
    --network base-sepolia

  # または snarkjs の出力ファイルを直接指定（推奨）
  pnpm --filter contract exec hardhat verifyProof \
    --proof-file ../circuit/data/VoiceOwnership_proof.json \
    --public-file ../circuit/data/VoiceOwnership_public.json \
    --network base-sepolia

  # 引数省略時は既定ファイルを自動使用
  # ../circuit/data/VoiceOwnership_proof.json
  # ../circuit/data/VoiceOwnership_public.json
  pnpm --filter contract exec hardhat verifyProof --network base-sepolia

  # テストネットE2E検証（Verifier は自動解決、見つからない場合は MockVerifier をデプロイ）
  pnpm --filter contract exec hardhat verifyTestnet --network base-sepolia
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
