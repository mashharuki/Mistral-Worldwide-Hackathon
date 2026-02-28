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
**Location**: `pkgs/contract/contracts/`（未作成）, `pkgs/contract/tasks/`
**Purpose**: Solidity スマートコントラクト + Hardhat タスク
**Pattern**: Hardhat 標準構成（contracts/, test/, ignition/）

### ZK Circuit (`pkgs/circuit/`)
**Location**: `pkgs/circuit/src/`
**Purpose**: Circom ZK 回路 + 証明生成スクリプト
**Pattern**: `src/` に .circom ファイル、`scripts/` にシェルスクリプト、`test/` にテスト

### MCP Server (`pkgs/mcpserver/`)
**Location**: `pkgs/mcpserver/src/`
**Purpose**: Hono ベースの API サーバー
**Pattern**: `src/index.ts` がエントリポイント。TypeScript → `dist/` にビルド

### Backend (`pkgs/backend/`)
**Location**: `pkgs/backend/`
**Purpose**: バックエンドサービス（初期段階）
**Pattern**: 未構築

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
