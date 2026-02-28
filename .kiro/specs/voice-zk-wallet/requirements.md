# Requirements Document

## Introduction

本仕様は、Mistral AI Worldwide Hackathon 向けプロトタイプ「Voice ZK Wallet」の要件を定義する。操作者の声の特徴量をゼロ知識証明で秘匿化し、決定論的に ERC-4337 スマートウォレットを生成・操作する次世代型決済 AI エージェントシステムである。

全ての操作は ElevenLabs SDK による音声 AI エージェントと MCP サーバーを介して音声で実行される。声が「鍵」となり、ブロックチェーン上のデジタル資産を管理する。

### システム構成

- **ZK Circuit** (`pkgs/circuit`): 声の特徴量を Poseidon ハッシュで秘匿化する Circom 回路
- **Smart Contract** (`pkgs/contract`): ZK Proof 検証 + ERC-4337 ウォレット（Base Sepolia）
- **Backend Server** (`pkgs/backend`): 声の特徴量抽出 + ZK Proof 生成（Python / Flask / Cloud Run）
- **MCP Server** (`pkgs/mcpserver`): AI エージェントのツール呼び出しハブ（Hono / TypeScript / Cloud Run）
- **Frontend** (`pkgs/frontend`): ElevenLabs 音声 AI エージェント UI（React / Vite / Tailwind / shadcn/ui）

### 参考実装

[SoraSuegami/voice_recovery_circuit](https://github.com/SoraSuegami/voice_recovery_circuit) のアーキテクチャ（RawNet3 + Fuzzy Commitment + Poseidon Hash + Halo2）を本プロジェクトの設計指針とする。ただし ZK 証明スキームは Groth16（Circom）を採用する。

---

## Requirements

### Requirement 1: 声の特徴量抽出

**Objective:** 操作者として、自分の声から一意な特徴量を抽出してほしい。それにより声がデジタルアイデンティティの基盤となる。

#### Acceptance Criteria

1. When 操作者が音声データを送信した場合, the Backend Server shall 音声データから話者埋め込みベクトル（speaker embedding）を抽出する
2. The Backend Server shall 抽出した特徴量ベクトルを二値化（binarize）し、固定長のバイナリ特徴量ベクトルに変換する
3. The Backend Server shall 同一話者の異なる音声サンプルから抽出した特徴量が、一定のハミング距離閾値以内に収まることを保証する
4. The Backend Server shall 音声特徴量抽出に Hugging Face 上のファインチューニング済みモデル（`mistral-hackaton-2026`）を使用する。利用不可の場合は Mistral AI モデルにフォールバックする
5. If 音声データの品質が不十分な場合, the Backend Server shall エラーメッセージを返却し、再録音を促す

### Requirement 2: ゼロ知識証明による特徴量の秘匿化

**Objective:** 操作者として、自分の声の特徴量を一切公開せずにオンチェーンで利用したい。それによりプライバシーが保護される。

#### Acceptance Criteria

1. The ZK Circuit shall 声のバイナリ特徴量ベクトルとソルトを入力として、Poseidon ハッシュによるコミットメントを出力する
2. The ZK Circuit shall Fuzzy Commitment スキーム（BCH 誤り訂正符号 + XOR）を実装し、声の生体認証ノイズを許容する
3. The ZK Circuit shall コミットメントから元の声の特徴量を逆算できないことを暗号学的に保証する
4. When 操作者が声の所有権を証明する場合, the ZK Circuit shall 秘密入力（特徴量 + ソルト）から生成したコミットメントが公開コミットメントと一致することを検証する Groth16 証明を生成する
5. The Backend Server shall snarkjs を使用して Groth16 証明を生成し、Solidity Verifier コントラクト用の証明データを出力する

### Requirement 3: ERC-4337 ウォレットの決定論的生成

**Objective:** 操作者として、自分の声から決定論的にウォレットアドレスが生成されてほしい。それにより同じ声からは常に同じウォレットにアクセスできる。

#### Acceptance Criteria

1. The Smart Contract shall 声のコミットメント（Poseidon ハッシュ出力）から決定論的に ERC-4337 準拠のウォレットアドレスを算出する
2. The Smart Contract shall ERC-4337 Account Abstraction 規格に準拠し、UserOperation を処理できる
3. The Smart Contract shall Base Sepolia テストネット上にデプロイされる
4. When 同一の声のコミットメントが提供された場合, the Smart Contract shall 常に同一のウォレットアドレスを返却する
5. The Smart Contract shall ZK Proof の検証ロジックを含み、声の所有権証明なしにはウォレット操作を許可しない

### Requirement 4: ウォレット残高の取得

**Objective:** 操作者として、自分の声に紐づいたウォレットの残高を音声で確認したい。それにより資産状況を素早く把握できる。

#### Acceptance Criteria

1. When 操作者が残高照会を要求した場合, the MCP Server shall 該当ウォレットの ETH 残高を取得して返却する
2. When 操作者が残高照会を要求した場合, the MCP Server shall 該当ウォレットの USDC 残高を取得して返却する
3. The MCP Server shall 残高をユーザーフレンドリーな形式（例: "0.5 ETH", "100 USDC"）で返却する
4. If ウォレットがまだ生成されていない場合, the MCP Server shall ウォレット未作成であることを通知し、作成を促す

### Requirement 5: ウォレットアドレスの取得と表示

**Objective:** 操作者として、自分の声に紐づいたウォレットアドレスを確認・共有したい。それにより入金先を他者に伝えられる。

#### Acceptance Criteria

1. When 操作者がウォレットアドレスの取得を要求した場合, the MCP Server shall 声のコミットメントから導出されたウォレットアドレスを返却する
2. When 操作者が QR コード表示を要求した場合, the Frontend shall ウォレットアドレスを QR コードとして画面に表示する
3. The Frontend shall QR コードに EIP-681 形式のペイメントリンクを含める
4. The MCP Server shall ウォレットアドレスを 0x プレフィックス付きの完全なチェックサム形式で返却する

### Requirement 6: トークンの送金

**Objective:** 操作者として、自分の声に紐づいたウォレットから音声指示でトークンを送金したい。それにより手を使わずに決済を完了できる。

#### Acceptance Criteria

1. When 操作者が ETH 送金を要求した場合, the MCP Server shall 送金先アドレスと金額を確認し、トランザクションを実行する
2. When 操作者が USDC 送金を要求した場合, the MCP Server shall ERC-20 transfer を実行する
3. While トランザクションが処理中の場合, the Frontend shall 処理状況をリアルタイムに表示する
4. When トランザクションが完了した場合, the MCP Server shall トランザクションハッシュと結果を返却する
5. If 残高が不足している場合, the MCP Server shall 残高不足エラーを返却し、送金を実行しない
6. The MCP Server shall 送金実行前に操作者に金額・送金先の確認を行う（音声による二重確認）

### Requirement 7: MCP サーバーのツール統合

**Objective:** AI エージェントとして、操作者の音声指示に基づき適切なツールを呼び出したい。それにより全てのウォレット操作を音声で完結できる。

#### Acceptance Criteria

1. The MCP Server shall Model Context Protocol に準拠したツールインターフェースを提供する
2. The MCP Server shall 以下の 6 つのツールを実装する:
   - `extract_voice_features`: 声の特徴量を抽出
   - `generate_zk_wallet`: 特徴量から ZK 証明 + 決定論的ウォレットアドレスを算出
   - `get_wallet_balance`: ウォレット残高（ETH / USDC）を取得
   - `get_wallet_address`: ウォレットアドレスを取得
   - `show_wallet_qrcode`: ウォレットアドレスの QR コードを表示
   - `transfer_tokens`: トークン（ETH / USDC）を送金
3. The MCP Server shall Hono + TypeScript で実装され、Cloud Run 上で実行される
4. The MCP Server shall MCP Inspector でのテストに対応する
5. When ツール呼び出しが失敗した場合, the MCP Server shall 構造化されたエラーレスポンスを返却する

### Requirement 8: 音声 AI エージェントとの対話

**Objective:** 操作者として、自然な日本語の音声会話を通じてウォレットを操作したい。それによりクリプトに不慣れでも直感的に使える。

#### Acceptance Criteria

1. The Frontend shall ElevenLabs SDK を使用したリアルタイム音声会話インターフェースを提供する
2. The Frontend shall WebRTC または WebSocket による低遅延の音声通信を実現する
3. The Frontend shall 操作者の発話をリアルタイムでテキスト表示する
4. The Frontend shall AI エージェントの応答を音声とテキストの両方で出力する
5. While セッションが接続中の場合, the Frontend shall 接続状態・発話状態をリアルタイムに表示する
6. The AI Agent shall Mistral AI の LLM モデルを推論エンジンとして使用する

### Requirement 9: フロントエンド UI/UX

**Objective:** 操作者として、「まるで魔法のようだ」と感じるほどの革新的な UI 体験を得たい。それによりプロダクトの印象が圧倒的に差別化される。

#### Acceptance Criteria

1. The Frontend shall React + Vite + TypeScript + Tailwind CSS + shadcn/ui で構築される
2. The Frontend shall 汎用的な AI 生成 UI を避け、以下のデザイン原則に従う:
   - **タイポグラフィ**: Inter/Roboto を避け、JetBrains Mono / Space Grotesk / IBM Plex 等の個性的なフォントを採用。フォントウェイトの極端なコントラスト（100/200 vs 800/900）を使用
   - **カラー**: 紫グラデーション on 白を避け、大胆なブランドカラーとシャープなアクセントカラーを使用。CSS 変数でテーマを統一管理
   - **モーション**: ページロード時のスタガードアニメーション、CSS アニメーションと Framer Motion による演出
   - **背景**: 単色ホワイトを避け、レイヤードグラデーションや幾何学パターンで奥行きを表現
3. The Frontend shall 音声会話中にビジュアルフィードバック（波形表示、パルスアニメーション等）を表示する
4. The Frontend shall ウォレット操作の結果（残高・アドレス・QR コード・トランザクション）をカード形式のリッチな UI で表示する
5. The Frontend shall PWA（Progressive Web App）として動作する（Vercel へのデプロイ対応）
6. The Frontend shall モバイル・デスクトップの両方に対応するレスポンシブデザインとする

### Requirement 10: バックエンドサーバー

**Objective:** システムとして、声の特徴量抽出と ZK 証明生成を安全かつ高速に処理したい。それにより音声からウォレット操作までのレイテンシが最小化される。

#### Acceptance Criteria

1. The Backend Server shall Python（Flask API）で実装され、Cloud Run 上で実行される
2. The Backend Server shall Docker コンテナとしてパッケージ化される
3. The Backend Server shall REST API エンドポイントを提供し、.http ファイルによるテストに対応する
4. When 音声データを受信した場合, the Backend Server shall 話者埋め込みモデルを使用して特徴量を抽出し、バイナリベクトルに変換する
5. When ZK 証明生成を要求された場合, the Backend Server shall snarkjs を使用して Groth16 証明を生成し、Solidity Verifier 互換のデータを返却する
6. The Backend Server shall 声の生データや特徴量をサーバー上に永続化しない（処理完了後に破棄する）

### Requirement 11: セキュリティとプライバシー

**Objective:** 操作者として、自分の声のデータと資産が安全に保護されることを確信したい。それにより安心してシステムを利用できる。

#### Acceptance Criteria

1. The System shall 声の生音声データおよび特徴量ベクトルをオンチェーンに保存しない
2. The System shall オンチェーンにはコミットメント（Poseidon ハッシュ出力）のみを保存する
3. The Backend Server shall 処理中の音声データと特徴量をメモリ上でのみ処理し、処理完了後に破棄する
4. The Smart Contract shall 有効な ZK Proof なしにはウォレットの状態変更操作を許可しない
5. The MCP Server shall 送金操作実行前に音声による操作確認を必須とする
6. If ZK Proof の検証が失敗した場合, the Smart Contract shall トランザクションを revert する
