# Gap Analysis: voice-zk-wallet

_生成日: 2026-02-28_

## 概要

Voice ZK Wallet の 11 要件に対し、既存コードベースとのギャップを分析した。インフラ基盤（フロントエンド骨格、ZK 回路パイプライン、Hardhat 設定、Hono サーバー）は整備済みだが、コア機能（声の特徴量処理、スマートコントラクト、MCP ツール群、バックエンドサービス）は未実装である。

---

## 1. 要件-資産マップ

| 要件 | 既存資産 | ギャップ | ステータス |
|------|----------|----------|------------|
| **Req 1**: 声の特徴量抽出 | なし | バックエンド全体（Python/Flask/モデル） | ❌ Missing |
| **Req 2**: ZK 証明秘匿化 | `LicensePlateCommitment.circom` + Groth16 パイプライン | 回路を声の特徴量用に書き換え + Fuzzy Commitment 追加 | 🔄 要修正 |
| **Req 3**: ERC-4337 ウォレット | Hardhat 設定 + OZ/AA 依存関係 | コントラクト本体（Wallet, Factory, Verifier Wrapper） | ❌ Missing |
| **Req 4**: 残高取得 | なし | MCP ツール + Web3 接続 | ❌ Missing |
| **Req 5**: アドレス取得/QR | なし | MCP ツール + フロントエンド QR コンポーネント | ❌ Missing |
| **Req 6**: トークン送金 | なし | MCP ツール + トランザクション実行ロジック | ❌ Missing |
| **Req 7**: MCP ツール統合 | Hono サーバー骨格 | 6 ツール全て + MCP SDK 統合 | 🔄 要拡張 |
| **Req 8**: 音声 AI エージェント | ElevenLabs SDK 統合済み（App.tsx 381行） | Mistral AI LLM 連携 | 🔄 要拡張 |
| **Req 9**: フロントエンド UI/UX | React 19 + Vite + ElevenLabs UI | Tailwind/shadcn/ui/カスタムデザイン全体 | 🔄 要大幅改修 |
| **Req 10**: バックエンドサーバー | package.json のみ | Python/Flask/Docker/モデル統合全て | ❌ Missing |
| **Req 11**: セキュリティ | なし | ZK Proof 検証ロジック、データ破棄ポリシー | ❌ Missing |

---

## 2. 再利用可能な既存資産

### そのまま再利用可能 ✅

| 資産 | パス | 活用方法 |
|------|------|----------|
| Groth16 パイプライン | `pkgs/circuit/scripts/executeGroth16.sh` | 回路コンパイル → セットアップ → 証明 → Verifier 生成の完全なワークフロー |
| Poseidon ハッシュ | `circomlib/circuits/poseidon.circom` | 声の特徴量コミットメントに直接利用 |
| ElevenLabs 対話 UI | `pkgs/frontend/src/App.tsx` | WebRTC/WS 接続、メッセージ表示、マイク制御 |
| Hardhat 環境 | `pkgs/contract/hardhat.config.ts` | Base Sepolia 設定、OZ/AA 依存関係 |
| Hono サーバー骨格 | `pkgs/mcpserver/src/index.ts` | MCP ツールのエンドポイント基盤 |
| ZK 成果物コピー | `pkgs/circuit/package.json` の `cp:zk`, `cp:verifier` | フロントエンド/バックエンドへの .wasm/.zkey 配布 |
| PWA セットアップ | `pkgs/frontend/src/sw.ts` + vite-plugin-pwa | オフライン対応の基盤 |

### 修正して再利用 🔄

| 資産 | 必要な変更 |
|------|------------|
| `LicensePlateCommitment.circom` | 入力を `plateChars[8]` → `voiceFeatures[N]`（声の特徴量ベクトル長に合わせる）に変更。テンプレート名を `VoiceCommitment` に変更 |
| `generateInput.js` | 声の特徴量バイナリベクトルを入力として生成するように書き換え |
| `LicensePlateCommitment.test.js` | テストデータを声の特徴量形式に変更 |
| フロントエンド CSS | 現行 `App.css` を Tailwind CSS + shadcn/ui に完全移行 |

---

## 3. 実装アプローチ検討

### Option A: 既存拡張型（各パッケージを段階的に拡張）

**対象**: ZK Circuit, MCP Server, Frontend

| 対象 | 方針 |
|------|------|
| Circuit | `LicensePlateCommitment.circom` をコピーして `VoiceCommitment.circom` を作成。Poseidon + Fuzzy Commitment を追加 |
| MCP Server | `index.ts` に直接 6 ツールのルートを追加。Hono のルーティング機能を活用 |
| Frontend | `App.tsx` を分割してコンポーネント化。Tailwind/shadcn を導入してリデザイン |
| Contract | 新規作成（拡張の余地なし） |
| Backend | 新規作成（拡張の余地なし） |

**トレードオフ**:
- ✅ 既存の動作コードを最大限活用
- ✅ ElevenLabs 統合の実績がある
- ❌ App.tsx が肥大化するリスク
- ❌ MCP Server の index.ts が複雑になる

### Option B: 新規コンポーネント型（責務ごとにファイルを分離）

**対象**: 全パッケージ

| 対象 | 方針 |
|------|------|
| Circuit | `VoiceCommitment.circom` + `VoiceOwnership.circom` を新規作成。既存回路は参考として残す |
| MCP Server | ツールごとにモジュール分離: `tools/extract.ts`, `tools/wallet.ts`, `tools/transfer.ts` 等 |
| Frontend | ページ・コンポーネント分離: `components/VoiceOrb.tsx`, `components/WalletCard.tsx`, `pages/Home.tsx` 等 |
| Contract | `VoiceWallet.sol`, `VoiceWalletFactory.sol`, `VoiceVerifier.sol` を新規作成 |
| Backend | Python プロジェクトを `pkgs/backend/` に新規構築 |

**トレードオフ**:
- ✅ 責務が明確で保守しやすい
- ✅ テストが書きやすい
- ❌ ファイル数が増える
- ❌ 初期セットアップに時間がかかる

### Option C: ハイブリッド型（推奨）

**方針**: コア機能は新規作成、UI/サーバー骨格は既存を拡張

| レイヤー | アプローチ | 理由 |
|----------|------------|------|
| Circuit | **新規作成** | 声の特徴量はナンバープレートと入力形式が根本的に異なる。Fuzzy Commitment の追加も必要 |
| Contract | **新規作成** | コントラクトが存在しないため新規のみ |
| Backend | **新規作成** | Python プロジェクトが存在しないため新規のみ |
| MCP Server | **拡張+分離** | Hono 骨格を活用しつつ、ツールはモジュール分離 |
| Frontend | **拡張+リデザイン** | ElevenLabs 統合を活かしつつ、コンポーネント分離 + Tailwind/shadcn 導入 |

**トレードオフ**:
- ✅ 各レイヤーに最適なアプローチを選択
- ✅ 既存の ElevenLabs 統合と Groth16 パイプラインを活用
- ✅ ハッカソンの時間制約に対応しやすい段階的実装が可能
- ❌ アプローチが混在するため一貫性に注意が必要

---

## 4. 実装複雑度とリスク評価

| 要件 | 工数 | リスク | 根拠 |
|------|------|--------|------|
| Req 1: 声の特徴量抽出 | **XL** | **High** | 話者埋め込みモデルの選定・統合が未知。HuggingFace モデルの可用性が不確定 |
| Req 2: ZK 証明秘匿化 | **L** | **High** | Fuzzy Commitment の Circom 実装は複雑。BCH 誤り訂正を算術回路で表現する難易度が高い |
| Req 3: ERC-4337 ウォレット | **L** | **Medium** | AA 規格の理解が必要だが、OZ/AA ライブラリが整備済み |
| Req 4: 残高取得 | **S** | **Low** | ethers/viem の標準的な呼び出し |
| Req 5: アドレス/QR | **S** | **Low** | アドレス導出は決定論的。QR ライブラリは豊富 |
| Req 6: トークン送金 | **M** | **Medium** | ERC-4337 UserOperation の構築が必要。ガス推定の複雑さ |
| Req 7: MCP ツール統合 | **M** | **Medium** | MCP SDK の習熟が必要。6 ツールの統合テスト |
| Req 8: 音声 AI エージェント | **S** | **Low** | ElevenLabs 統合が既に動作。Mistral AI 連携は ElevenLabs Agent 設定 |
| Req 9: フロントエンド UI | **L** | **Medium** | Tailwind/shadcn 導入 + カスタムデザイン。アニメーション実装 |
| Req 10: バックエンド | **XL** | **High** | Python/Flask + Docker + ML モデル + snarkjs 統合。クロス言語統合 |
| Req 11: セキュリティ | **M** | **Medium** | コントラクト監査水準は不要（ハッカソン）だが、基本的なプライバシー保護は必須 |

### 全体工数: **XL**（ハッカソン期間中は MVP スコープが必須）
### 全体リスク: **High**（声の特徴量処理 + ZK 回路の複雑さ）

---

## 5. 要調査事項（Research Needed）

| 項目 | 内容 | 設計フェーズでの対応 |
|------|------|---------------------|
| 🔍 話者埋め込みモデル | `mistral-hackaton-2026` の可用性と API インターフェース。フォールバックとして RawNet3 or pyannote の評価 | モデル選定と統合方法の確定 |
| 🔍 Fuzzy Commitment in Circom | BCH 誤り訂正を Circom の算術回路で実装できるか。代替として単純なハミング距離閾値チェックの検討 | 回路設計の詳細決定 |
| 🔍 声の特徴量ベクトル長 | RawNet3 は 256 次元だが、Circom Poseidon の入力上限を確認（現在は 9 入力）。バイトパッキング戦略 | 回路パラメータの確定 |
| 🔍 ERC-4337 EntryPoint | Base Sepolia 上の EntryPoint v0.7 アドレスと互換性 | コントラクト設計の確定 |
| 🔍 MCP SDK for TypeScript | Model Context Protocol の TypeScript SDK の API 仕様。Hono との統合パターン | MCP ツール実装設計 |
| 🔍 ElevenLabs + Mistral AI | ElevenLabs Agent に Mistral AI の LLM を推論エンジンとして設定する方法 | Agent 設定の詳細 |
| 🔍 Cloud Run デプロイ | Backend（Python）と MCP Server（Node.js）の Dockerfile 構成。マルチサービス構成 | デプロイ戦略の確定 |

---

## 6. クリティカルパス

```
声の特徴量抽出モデル選定 (Req 1)
    ↓
ZK 回路設計（特徴量ベクトル長に依存） (Req 2)
    ↓
Verifier コントラクト生成 + ERC-4337 ウォレット (Req 3)
    ↓
MCP ツール実装 (Req 7)
    ↓
フロントエンド統合 (Req 8, 9)
```

**ボトルネック**: Req 1（モデル選定）と Req 2（Fuzzy Commitment の Circom 実装）が全体のクリティカルパスを決定する。

---

## 7. 推奨事項

1. **アプローチ**: Option C（ハイブリッド型）を推奨
2. **優先順位**: Backend (Req 1, 10) → Circuit (Req 2) → Contract (Req 3) → MCP (Req 7) → Frontend (Req 8, 9)
3. **MVP スコープ**: ハッカソン期間を考慮し、Fuzzy Commitment を簡略化（単純コミットメント + ハミング距離チェックをオフチェーンで実行）する可能性を検討
4. **リスク軽減**: 話者埋め込みモデルの選定を最優先で着手。代替モデル（pyannote-audio, SpeechBrain）も並行調査

---
_本分析は設計フェーズの入力として使用される。最終的な実装判断は設計ドキュメントで確定する。_
