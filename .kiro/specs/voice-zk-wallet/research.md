# Research & Design Decisions: voice-zk-wallet

---
**Purpose**: Voice ZK Wallet の技術設計を裏付けるディスカバリー調査結果と設計判断の記録。

**Usage**:
- 設計フェーズでの調査活動とその成果を記録
- `design.md` に収まらない詳細なトレードオフを文書化
- 将来の監査・再利用のためのエビデンスを提供
---

## Summary
- **Feature**: `voice-zk-wallet`
- **Discovery Scope**: New Feature（グリーンフィールド + 一部既存拡張）
- **Key Findings**:
  - Circom Poseidon の最大入力数は 16。512次元の話者埋め込みベクトルを扱うにはチャンク化 + 反復ハッシュが必須
  - ElevenLabs Conversational AI は Custom LLM（OpenAI 互換 API）経由で Mistral AI を統合可能。MCP サーバーはツールとして直接接続可能
  - ERC-4337 EntryPoint v0.7.0 は Base Sepolia 上で `0x0000000071727De22E5E9d8BAf0edAc6f37da032` にデプロイ済み

## Research Log

### 話者埋め込みモデルの選定
- **Context**: Req 1 で声の特徴量抽出に使用するモデルを決定する必要がある
- **Sources Consulted**:
  - [pyannote/embedding - Hugging Face](https://huggingface.co/pyannote/embedding) — 512次元、TDNN ベース
  - [Wespeaker/wespeaker-ecapa-tdnn512-LM](https://huggingface.co/Wespeaker/wespeaker-ecapa-tdnn512-LM) — ECAPA-TDNN、512次元
  - [speechbrain/spkrec-ecapa-voxceleb](https://huggingface.co/speechbrain/spkrec-ecapa-voxceleb) — SpeechBrain ECAPA-TDNN、192次元
- **Findings**:
  - pyannote embedding: 512次元、500ms チャンク対応。SincNet + x-vector アーキテクチャ
  - WeSpeaker ECAPA-TDNN-512: 512次元、VoxCeleb2 で訓練。pyannote.audio 3.1+ でラッパー利用可
  - SpeechBrain ECAPA-TDNN: 192次元。軽量だが精度は WeSpeaker に劣る
  - 要件にある `mistral-hackaton-2026` モデルは未確認。フォールバックとして上記モデルを使用
- **Implications**:
  - 512次元モデル採用の場合、Circom Poseidon の 16入力制限に対応するバイトパッキング戦略が必要
  - 192次元の SpeechBrain はパッキング負荷が低いが精度面でリスク
  - **推奨**: pyannote/wespeaker 512次元を第一候補、SpeechBrain 192次元をフォールバック

### Circom Poseidon ハッシュの入力制限とパッキング戦略
- **Context**: 512次元のバイナリベクトルを Poseidon でハッシュするための回路設計
- **Sources Consulted**:
  - [iden3/circomlib poseidon.circom](https://github.com/iden3/circomlib/blob/master/circuits/poseidon.circom)
  - [RareSkills Circom Tutorial](https://rareskills.io/post/circom-tutorial)
- **Findings**:
  - Poseidon(nInputs) の最大 nInputs は **16**（`N_ROUNDS_P[16]` 配列サイズに制限）
  - 512ビットのバイナリベクトルを 16入力に収めるには、32ビットずつパッキングして 16フィールド要素に変換（512 / 32 = 16）
  - 代替: Merkle Tree 構造で逐次ハッシュ（柔軟だが回路制約数が増加）
  - 既存の LicensePlateCommitment.circom は Poseidon(9) を使用（8入力 + salt）
- **Implications**:
  - 512次元バイナリベクトル → 32ビットパッキング → Poseidon(16) で 15チャンク + salt = ちょうど 16入力に収まる
  - ハッカソンスコープでは Merkle Tree よりフラットパッキングが実装容易

### Fuzzy Commitment スキームの Circom 実装
- **Context**: 声の生体認証ノイズを許容する ZK 回路の設計方針
- **Sources Consulted**:
  - [SoraSuegami/voice_recovery_circuit](https://github.com/SoraSuegami/voice_recovery_circuit) — Halo2 ベースの実装
  - [ZKVoiceKey - ETHGlobal](https://ethglobal.com/showcase/zkvoicekey-zeufj) — Fuzzy Commit + ZKP
  - [Privacy-preserving speaker verification (IET Biometrics)](https://ietresearch.onlinelibrary.wiley.com/doi/full/10.1049/bme2.12013)
  - [ZK-Series: Privacy-Preserving Authentication](https://arxiv.org/html/2506.19393)
- **Findings**:
  - SoraSuegami の voice_recovery_circuit: Halo2 ベースで Fuzzy Commitment + BCH 誤り訂正。Circom への直接移植は困難
  - ZKVoiceKey: Fuzzy Commit で声の差異を誤り訂正符号で吸収し、ZKP で認証
  - BCH 誤り訂正を算術回路（Circom）で表現するのは非常に複雑（GF(2) 演算がフィールド演算と不一致）
  - 簡略化アプローチ: ハミング距離チェックを回路内で実行（XOR + ビットカウント）
- **Implications**:
  - **ハッカソンスコープ**: BCH 誤り訂正の完全実装は断念。ハミング距離閾値チェックを回路内で実施
  - 登録時の特徴量をリファレンスとし、認証時の特徴量との XOR → ポップカウント → 閾値比較で許容判定
  - 将来的に BCH/Reed-Solomon への拡張パスを残す

### ERC-4337 Account Abstraction on Base Sepolia
- **Context**: ZK Proof 検証付きスマートウォレットの設計
- **Sources Consulted**:
  - [Entry Point 0.7.0 on BaseScan](https://basescan.org/address/0x0000000071727de22e5e9d8baf0edac6f37da032)
  - [ERC-4337 Documentation](https://docs.erc4337.io/smart-accounts/entrypoint-explainer.html)
  - [Pimlico Documentation](https://docs.pimlico.io/guides/tutorials/tutorial-2)
- **Findings**:
  - EntryPoint v0.7.0: `0x0000000071727De22E5E9d8BAf0edAc6f37da032`（全チェーン共通シングルトン）
  - @account-abstraction/contracts v0.7.0 は既にインストール済み
  - SimpleAccount を拡張して ZK Proof 検証ロジックを追加するパターンが一般的
  - CREATE2 + commitment をソルトに使用して決定論的アドレス生成
- **Implications**:
  - SimpleAccount をベースにカスタム validateUserOp を実装
  - Factory コントラクトで CREATE2 + commitment ハッシュからアドレスを導出
  - Groth16 Verifier コントラクトを executeGroth16.sh で自動生成

### MCP SDK + Hono 統合
- **Context**: MCP サーバーの TypeScript 実装方針
- **Sources Consulted**:
  - [@modelcontextprotocol/sdk npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
  - [@hono/mcp npm](https://www.npmjs.com/package/@hono/mcp)
  - [MCP TypeScript SDK V2](https://ts.sdk.modelcontextprotocol.io/v2/)
  - [mhart/mcp-hono-stateless](https://github.com/mhart/mcp-hono-stateless) — Streamable HTTP 実装例
- **Findings**:
  - `@hono/mcp` パッケージが公式で提供されている
  - `StreamableHTTPTransport` で Hono + MCP を接続
  - Streamable HTTP トランスポートが Cloud Run デプロイに最適（ステートレス）
  - DNS リバインディング保護が `createMcpHonoApp()` に組み込み済み
- **Implications**:
  - `@hono/mcp` + `@modelcontextprotocol/sdk` でサーバー構築
  - Streamable HTTP トランスポートを採用（Cloud Run 対応）
  - ElevenLabs Agent から MCP サーバーへの直接接続が可能

### ElevenLabs + Mistral AI 統合
- **Context**: 音声 AI エージェントの LLM バックエンド設定
- **Sources Consulted**:
  - [ElevenLabs Custom LLM Documentation](https://elevenlabs.io/docs/agents-platform/customization/llm/custom-llm)
  - [ElevenLabs MCP Tool Integration](https://elevenlabs.io/docs/agents-platform/customization/tools/mcp)
  - [ElevenLabs Models Documentation](https://elevenlabs.io/docs/agents-platform/customization/llm)
- **Findings**:
  - ElevenLabs は Custom LLM として OpenAI 互換 API を受け付ける
  - Mistral AI の Chat Completions API (`https://api.mistral.ai/v1/chat/completions`) は OpenAI 互換
  - MCP サーバーは SSE または Streamable HTTP トランスポートで ElevenLabs Agent に接続可能
  - Agent 設定で Custom LLM URL + API Key + Model ID を指定
- **Implications**:
  - Mistral AI を Custom LLM として設定（OpenAI 互換エンドポイント使用）
  - MCP ツールを ElevenLabs Agent のツール定義として登録
  - フロントエンドは ElevenLabs Agent ID のみで接続（LLM 設定はダッシュボード側）

## Architecture Pattern Evaluation

| Option | Description | Strengths | Risks / Limitations | Notes |
|--------|-------------|-----------|---------------------|-------|
| モノレポ分離型（採用） | pkgs/ 配下の 5 パッケージで責務を分離。Backend(Python) と MCP Server(TS) は REST API で通信 | 各パッケージ独立ビルド・テスト可能。技術スタック混在に対応 | サービス間通信のレイテンシ | 既存ステアリングに準拠 |
| マイクロサービス型 | 各機能を独立サービスとしてデプロイ | スケーラビリティ最大化 | ハッカソンでは過剰。インフラ管理コスト大 | 不採用 |
| モノリシック型 | 全機能を単一サービスに統合 | デプロイが簡単 | Python + TypeScript の統合が困難。責務の混在 | 不採用 |

## Design Decisions

### Decision: ハミング距離閾値チェックによる簡略 Fuzzy Commitment
- **Context**: 声の生体認証ノイズを ZK 回路内で許容する必要がある（Req 2.2）
- **Alternatives Considered**:
  1. BCH 誤り訂正符号の完全実装（SoraSuegami 方式）— Circom 算術回路での GF(2) 演算が極めて困難
  2. オフチェーンハミング距離チェック — ZK の秘匿性が損なわれる
  3. 回路内ハミング距離閾値チェック — XOR + ビットカウントで実装可能
- **Selected Approach**: Option 3 — 回路内ハミング距離閾値チェック
- **Rationale**: Circom の算術制約で XOR とポップカウントは効率的に表現可能。BCH の完全実装はハッカソン期間では非現実的
- **Trade-offs**: BCH ほどの誤り耐性はないが、閾値パラメータ調整で実用レベルの精度を確保可能
- **Follow-up**: 閾値パラメータの最適値を実験的に決定（登録/認証テストデータ必要）

### Decision: 512次元ベクトルの 32ビットパッキング + Poseidon(16)
- **Context**: 高次元の話者埋め込みベクトルを Circom Poseidon でハッシュする方法（Req 2.1）
- **Alternatives Considered**:
  1. Merkle Tree 構造で逐次ハッシュ — 柔軟だが回路制約数が大幅に増加
  2. 32ビットパッキング + Poseidon(16) — 512ビット / 32 = 16入力（salt 含めると超過）
  3. 64ビットパッキング + Poseidon(9) — 512ビット / 64 = 8入力 + salt = 9入力
- **Selected Approach**: Option 3 — 64ビットパッキング + Poseidon(9)
- **Rationale**: 既存 LicensePlateCommitment が Poseidon(9) を使用しており互換性が高い。8チャンク + salt = 9入力で Poseidon(9) に収まる。制約数が最小
- **Trade-offs**: 64ビットパッキングはフィールド要素のオーバーフローに注意が必要だが、BN254 のフィールドサイズ（約 254ビット）に対して十分に小さい
- **Follow-up**: パッキング/アンパッキングの回路実装を検証

### Decision: SimpleAccount 拡張型 ERC-4337 ウォレット
- **Context**: ZK Proof 検証付きスマートウォレットの実装方式（Req 3）
- **Alternatives Considered**:
  1. SimpleAccount をそのまま使用 — ZK 検証ロジックなし
  2. SimpleAccount を拡張して validateUserOp に ZK 検証を追加
  3. フルスクラッチの BaseAccount 実装
- **Selected Approach**: Option 2 — SimpleAccount 拡張 + ZK 検証
- **Rationale**: @account-abstraction/contracts v0.7.0 の SimpleAccount が十分なベースを提供。validateUserOp のオーバーライドで ZK Proof 検証を追加するのが最も効率的
- **Trade-offs**: SimpleAccount の内部構造に依存するが、v0.7.0 は安定版
- **Follow-up**: EntryPoint v0.7.0 との互換性テスト

### Decision: Mistral AI を ElevenLabs Custom LLM として統合
- **Context**: 音声 AI エージェントの推論エンジン選定（Req 8.6）
- **Alternatives Considered**:
  1. ElevenLabs 組み込み LLM（GPT-4o 等）を使用
  2. Mistral AI を Custom LLM として OpenAI 互換 API 経由で接続
  3. 自前の LLM プロキシサーバーを構築
- **Selected Approach**: Option 2 — Mistral AI Custom LLM
- **Rationale**: Mistral AI の API は OpenAI Chat Completions 互換。ElevenLabs ダッシュボードで直接設定可能。ハッカソン要件に合致
- **Trade-offs**: Mistral AI の API レイテンシに依存。レート制限の確認が必要
- **Follow-up**: ElevenLabs ダッシュボードでの Agent 設定テスト

## Risks & Mitigations
- **Risk 1**: 声の特徴量モデル（`mistral-hackaton-2026`）が利用不可 → **Mitigation**: pyannote/wespeaker をフォールバックモデルとして準備
- **Risk 2**: ハミング距離閾値チェックの精度不足 → **Mitigation**: 閾値パラメータを調整可能に設計。実験データで最適化
- **Risk 3**: ZK 回路の制約数増大によるプルーフ生成時間の増加 → **Mitigation**: ptau-14 で十分か検証。必要なら ptau-16 にアップグレード
- **Risk 4**: Backend(Python) と MCP Server(TS) 間の通信レイテンシ → **Mitigation**: Cloud Run 同一リージョンデプロイ。レスポンスキャッシュの検討
- **Risk 5**: ElevenLabs + Mistral AI の Custom LLM 連携の不安定さ → **Mitigation**: ElevenLabs 組み込み LLM へのフォールバック設定

## References
- [SoraSuegami/voice_recovery_circuit](https://github.com/SoraSuegami/voice_recovery_circuit) — Halo2 ベースの Fuzzy Commitment 参考実装
- [ZKVoiceKey - ETHGlobal](https://ethglobal.com/showcase/zkvoicekey-zeufj) — ZK 声認証プロジェクト
- [iden3/circomlib poseidon.circom](https://github.com/iden3/circomlib/blob/master/circuits/poseidon.circom) — Poseidon 回路実装
- [ERC-4337 EntryPoint v0.7.0](https://basescan.org/address/0x0000000071727de22e5e9d8baf0edac6f37da032) — Base 上の EntryPoint
- [ElevenLabs Custom LLM](https://elevenlabs.io/docs/agents-platform/customization/llm/custom-llm) — カスタム LLM 統合ドキュメント
- [ElevenLabs MCP Integration](https://elevenlabs.io/docs/agents-platform/customization/tools/mcp) — MCP ツール統合
- [@hono/mcp](https://www.npmjs.com/package/@hono/mcp) — Hono MCP 統合パッケージ
- [MCP TypeScript SDK V2](https://ts.sdk.modelcontextprotocol.io/v2/) — MCP SDK ドキュメント
- [pyannote/embedding](https://huggingface.co/pyannote/embedding) — 512次元話者埋め込みモデル
