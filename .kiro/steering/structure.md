# Project Structure

## Organization Philosophy

**パッケージベース（モノレポ）**: 機能ドメインごとに `pkgs/` 配下に独立パッケージとして分離。各パッケージは独自の依存関係と設定を持つ。

## Directory Patterns

### Workspace Root
**Location**: `/`
**Purpose**: ワークスペース設定、共通ツール（Biome）、スクリプトエイリアス
**Example**: `pnpm frontend dev` → `pkgs/frontend` の dev スクリプトを実行

### Frontend (`pkgs/frontend/`)
**Location**: `pkgs/frontend/src/`
**Purpose**: React SPA - AI エージェントとの対話 UI
**Pattern**: Vite + React 19 + TypeScript。`src/` 配下にコンポーネントとエントリポイント

### Smart Contract (`pkgs/contract/`)
**Location**: `pkgs/contract/contracts/`, `pkgs/contract/tasks/`
**Purpose**: Solidity スマートコントラクト + Hardhat タスク
**Pattern**: Hardhat 標準構成（contracts/, test/, ignition/）。コントラクト: `VoiceWallet.sol`（ERC-4337 AA ウォレット）, `VoiceWalletFactory.sol`（決定論的アドレス生成）, `VoiceCommitmentVerifier.sol` / `VoiceOwnershipVerifier.sol`（ZK 検証）。`contracts/interfaces/` にインターフェース, `contracts/mocks/` にテスト用モック

### ZK Circuit (`pkgs/circuit/`)
**Location**: `pkgs/circuit/src/`
**Purpose**: Circom ZK 回路 + 証明生成スクリプト
**Pattern**: `src/` に .circom ファイル、`scripts/` にシェルスクリプト、`test/` にテスト

### MCP Server (`pkgs/mcpserver/`)
**Location**: `pkgs/mcpserver/src/`
**Purpose**: Hono + MCP SDK ベースの MCP サーバー（6 ツール公開）
**Pattern**: `src/index.ts` がエントリポイント（Hono + `@hono/node-server`）、`src/app.ts` が `McpServer` と全ツールを登録。`src/tools/` に各ツールハンドラ（`extractVoiceFeatures.ts`, `generateZkWallet.ts`, `getWalletAddress.ts`, `getWalletBalance.ts`, `showWalletQrcode.ts`, `transferTokens.ts`）、`src/lib/` に共有スキーマ・ユーティリティ。TypeScript → `dist/` にビルド。テストは `vitest`

### Backend (`pkgs/backend/`)
**Location**: `pkgs/backend/src/`
**Purpose**: 音声特徴量抽出・ZK 証明生成 REST API（Python / Flask）
**Pattern**: `src/app.py` が Flask アプリエントリポイント（`create_app()` ファクトリパターン）。`src/feature_extraction.py` で pyannote.audio による話者特徴量抽出（バイナリベクトル化）、`src/proof_generation.py` で snarkjs を呼び出し Groth16 証明を生成。エンドポイント: `GET /health`, `POST /extract-features`, `POST /generate-proof`。Docker コンテナ化済み、Cloud Run デプロイ対応。ZK 成果物は `zk/` 配下（`pnpm --filter backend zk:copy` でコピー）

## Naming Conventions

- **Files**: kebab-case（一般）, PascalCase（Circom テンプレート名に準拠したファイル名）
- **Components**: PascalCase（React コンポーネント）
- **Functions**: camelCase
- **Circom Templates**: PascalCase（例: `LicensePlateCommitment`）

## Import Organization

```typescript
// Biome の organizeImports により自動整理
import { serve } from "@hono/node-server";  // 外部パッケージ
import { Hono } from "hono";                // 外部パッケージ
import "./css/App.css";                      // ローカルファイル
```

**Path Aliases**: 現状未設定（相対パス使用）

## Code Organization Principles

- 各パッケージは独立してビルド・テスト可能
- ZK 回路の成果物（.wasm, .zkey）は `cp:zk` スクリプトでフロントエンド/バックエンドにコピー
- 環境変数は `.env`（gitignore 対象）で管理、dotenv で読み込み
- ルートの Biome 設定がワークスペース全体のフォーマット/リントを統一

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_
