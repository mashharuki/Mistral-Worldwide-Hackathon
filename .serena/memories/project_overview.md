# Mistral-Worldwide-Hackathon プロジェクト概要

## 目的
操作者の声のプライバシーを保護しつつ、ブロックチェーン上でアイデンティティを管理するシステム。
声の特徴量をゼロ知識証明（Poseidon ハッシュ）でコミットメント化し、
決定論的に ERC-4337 準拠のスマートウォレットを生成する。
音声によるウォレット操作は MCP サーバー経由で実現する。

## アーキテクチャ
pnpm workspace によるモノレポ構成（`pkgs/` 配下に 5 パッケージ）。

### パッケージ構成
| パッケージ | 言語 | フレームワーク | 用途 |
|-----------|------|-------------|------|
| `pkgs/frontend` | TypeScript | React 19 + Vite 7 | AI エージェントとの対話 UI（ElevenLabs） |
| `pkgs/backend` | Python | Flask 3.0 | ZK 証明生成 API（Cloud Run デプロイ） |
| `pkgs/contract` | Solidity 0.8.28 | Hardhat | VoiceWallet (ERC-4337) + ZK Verifier |
| `pkgs/circuit` | Circom 2.0 | snarkjs | VoiceCommitment / VoiceOwnership 回路 |
| `pkgs/mcpserver` | TypeScript | Hono | MCP サーバー（API エンドポイント） |

## 主要技術
- **ZK**: Circom 2.0 + snarkjs (Groth16) + Poseidon ハッシュ
- **Blockchain**: Base Sepolia テストネット, ERC-4337 Account Abstraction
- **AI 音声**: ElevenLabs (@elevenlabs/react)
- **パッケージ管理**: pnpm 10.20.0
- **Node.js**: v23+

## 仕様管理
Kiro-style Spec Driven Development。
アクティブ仕様: `voice-zk-wallet`（フェーズ: tasks-generated, 実装準備完了）。
