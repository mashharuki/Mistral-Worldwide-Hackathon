# Technology Stack

## Architecture

pnpm workspace によるモノレポ構成。フロントエンド、スマートコントラクト、ZK 回路、MCP サーバーが独立パッケージとして構成される。

## Core Technologies

- **Language**: TypeScript (フロントエンド, MCP サーバー), Python 3.9+ (バックエンド), Solidity (コントラクト), Circom (ZK 回路)
- **Framework**: React 19 + Vite 7 (フロントエンド), Flask 3.0 (バックエンド), Hardhat (コントラクト), Hono (MCP サーバー)
- **Runtime**: Node.js 23+ (コントラクト, MCP サーバー), pnpm 10.20.0 (パッケージマネージャー)
- **Blockchain**: Base Sepolia (テストネット), ERC-4337 Account Abstraction
- **ZK**: Circom 2.0 + snarkjs 0.6.9 + Poseidon ハッシュ

## Key Libraries

- `@elevenlabs/react` - AI 音声エージェント対話（フロントエンド）
- `@openzeppelin/contracts` - スマートコントラクト標準実装
- `@account-abstraction/contracts` - ERC-4337 AA
- `circomlib` - ZK 回路ライブラリ（Poseidon 等）
- `snarkjs` - Groth16 証明生成/検証
- `viem` - ブロックチェーン接続（MCP サーバー）
- `@modelcontextprotocol/sdk` + `@hono/mcp` - Streamable HTTP MCP サーバー実装
- `pyannote.audio` + `torch` - 話者特徴量抽出（バックエンド ML）
- `flask-cors` - バックエンド CORS 設定

## Development Standards

### Type Safety
- TypeScript strict mode（フロントエンド, MCP サーバー）
- Solidity 0.8.28 + viaIR

### Code Quality
- Biome (formatter + linter) - ルート設定
  - インデント: スペース
  - 引用符: ダブルクォート
  - import 自動整理: 有効
- solhint（Solidity リンター）

### Testing
- Hardhat test（コントラクト）
- circom_tester / chai（ZK 回路テスト）
- vitest（MCP サーバー）
- pytest（バックエンド）

## Development Environment

### Required Tools
- pnpm 10.20.0
- Node.js 23+
- Python 3.9+（バックエンド）
- pip / `requirements.txt`（`pyannote.audio`, `torch`, `flask` 等）
- Circom 2.0 コンパイラ（ZK 回路ビルド時）

### Common Commands
```bash
# フロントエンド
pnpm frontend dev        # 開発サーバー起動
pnpm frontend build      # ビルド

# バックエンド（Python / Flask）
pip3 install -r pkgs/backend/requirements.txt
pnpm --filter backend zk:copy      # ZK 成果物をコピー
pnpm --filter backend test         # pytest 実行
pnpm --filter backend docker:build # Docker イメージビルド
pnpm --filter backend cloudrun:deploy  # Cloud Run デプロイ

# コントラクト
pnpm contract compile    # コンパイル
pnpm contract test       # テスト実行

# ZK 回路
pnpm circuit compile     # 回路コンパイル
pnpm circuit executeGroth16  # Groth16 証明実行

# MCP サーバー
cd pkgs/mcpserver && pnpm dev  # 開発サーバー起動
pnpm mcpserver run build       # TypeScript ビルド
pnpm mcpserver run test        # vitest 実行

# コード品質
pnpm format              # Biome フォーマット
pnpm lint                # Biome リント
```

## Key Technical Decisions

- **Poseidon ハッシュ**: ZK-friendly なハッシュ関数を採用（SHA-256 等の代わりに）
- **Groth16**: 証明サイズが小さく検証が安価な ZK 証明スキーム
- **Base Sepolia**: テストネットとして Base L2 を採用（低コスト）
- **Hono**: 軽量高速な Web フレームワークを MCP サーバーに採用
- **Vite + SWC**: 高速ビルドのためのフロントエンドツールチェーン

---
_Document standards and patterns, not every dependency_
