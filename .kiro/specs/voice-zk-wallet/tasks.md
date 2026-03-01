# Implementation Plan

## Task 1. ZK 回路 — 声のコミットメントと所有権証明

- [x] 1.1 (P) VoiceCommitment 回路の構築
  - 512ビットの二値化特徴量を 8 つの 64ビットフィールド要素として受け取り、salt と合わせて Poseidon(9) でコミットメントを算出する回路を作成する
  - 既存の LicensePlateCommitment 回路を参考に、入力を声の特徴量ベクトル形式に適応させる
  - 各入力フィールド要素が 64ビット以内であることをレンジチェックで制約する
  - 回路コンパイルが通ることを確認する
  - _Requirements: 2.1, 2.3_

- [x] 1.2 VoiceOwnership 回路の構築
  - 登録時の特徴量（リファレンス）と認証時の特徴量を比較するハミング距離閾値チェックを実装する
  - 各ビットを分解して XOR → ポップカウント（合計）→ LessThan で閾値比較する回路ロジックを構築する
  - ハミング距離閾値をコンパイル時パラメータ（初期値: 128）として設定する
  - VoiceCommitment テンプレートを内部で呼び出し、リファレンス特徴量 + salt から生成したコミットメントが公開コミットメントと一致することを検証する
  - 回路コンパイルが通ることを確認する
  - _Requirements: 2.2, 2.4_

- [x] 1.3 回路テストと Groth16 パイプラインの実行
  - VoiceCommitment の単体テストを作成し、同一入力からの決定論的なコミットメント生成を検証する
  - VoiceOwnership のテストを作成し、ハミング距離閾値の境界値（閾値ちょうど、閾値+1、閾値-1）を検証する
  - 既存の executeGroth16.sh パイプラインを VoiceOwnership 回路に適応させ、Groth16 セットアップ → 証明生成 → 検証 → Solidity Verifier 生成までを実行する
  - 生成された Solidity Verifier コントラクトをコントラクトパッケージにコピーする
  - _Requirements: 2.4, 2.5_

## Task 2. バックエンドサーバー — 声の処理と ZK 証明生成

- [x] 2.1 (P) Flask API の骨格構築と Docker 設定
  - Python Flask アプリケーションの骨格を作成し、ヘルスチェックエンドポイントを実装する
  - CORS 設定、JSON レスポンス形式、エラーハンドリングのベース構造を整備する
  - Docker コンテナ設定を作成し、Python 3.11 + Node.js（snarkjs 用）のマルチステージビルドを構成する
  - .http テストファイルを作成し、各エンドポイントをテストできるようにする
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2.2 声の特徴量抽出エンドポイントの実装
  - 音声データ（Base64 エンコード）を受け取り、話者埋め込みモデルで 512次元の特徴量ベクトルを抽出するエンドポイントを実装する
  - pyannote-audio（または wespeaker）を話者埋め込みモデルとして統合する。`mistral-hackaton-2026` モデルが利用可能な場合はそちらを優先する
  - 抽出した 512次元ベクトルを閾値二値化して 512ビットのバイナリベクトルに変換する
  - バイナリベクトルを 64ビット単位でパッキングして 8 フィールド要素に変換する
  - 音声データの品質チェック（最低 1 秒、フォーマット検証）を実施し、品質不足時はエラーを返却する
  - 処理完了後に音声データと特徴量をメモリから破棄する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.4, 10.6, 11.3_

- [x] 2.3 ZK 証明生成エンドポイントの実装
  - 特徴量とソルトを受け取り、Poseidon コミットメントを算出するエンドポイントを実装する
  - snarkjs を Node.js サブプロセスとして呼び出し、一時ファイル経由で入力データを渡して Groth16 証明を生成する
  - ZK 回路パッケージの成果物（.wasm, .zkey）を Backend コンテナ内に配置するビルドステップを設定する
  - 証明データ（proof, publicSignals）と commitment を JSON で返却する
  - 認証フロー向けに、リファレンス特徴量と現在の特徴量のハミング距離をオフチェーンでも検証し、閾値超過時は証明生成前にエラーを返す
  - _Requirements: 2.5, 10.5, 11.1_

## Task 3. スマートコントラクト — ERC-4337 ウォレットと ZK 検証

- [x] 3.1 Groth16Verifier と VoiceWallet コントラクトの実装
  - ZK 回路パイプラインが生成した Solidity Verifier コントラクトをプロジェクトに統合する
  - SimpleAccount（ERC-4337 v0.7）を拡張した VoiceWallet コントラクトを実装する
  - 初期化時に voiceCommitment（公開コミットメント）、verifier アドレス、entryPoint アドレスを登録する
  - validateUserOp で userOp.signature から ZK Proof データをデコードし、Groth16Verifier に委譲して検証する
  - ZK Proof 検証失敗時はトランザクションを revert する
  - ETH 送金と ERC-20 トークン（USDC）transfer の実行関数を実装する
  - _Requirements: 3.1, 3.2, 3.5, 11.4, 11.6_
  - _Contracts: IVoiceWallet, IGroth16Verifier_

- [x] 3.2 VoiceWalletFactory コントラクトの実装
  - CREATE2 を使用して voiceCommitment から決定論的にウォレットアドレスを算出する Factory コントラクトを実装する
  - 同一の commitment + salt から常に同一のアドレスが導出されることを保証する
  - 未デプロイ状態でもアドレスを事前計算できる getAddress 関数を実装する
  - オンチェーンに保存するデータをコミットメントのみに限定する
  - _Requirements: 3.1, 3.4, 11.2_
  - _Contracts: IVoiceWalletFactory_

- [x] 3.3 コントラクトテストと Base Sepolia デプロイ
  - VoiceWallet の validateUserOp テストを作成し、有効な ZK Proof での成功と無効な Proof での revert を検証する
  - VoiceWalletFactory のテストを作成し、決定論的アドレス生成と getAddress の一致を検証する
  - EntryPoint v0.7.0（`0x0000000071727De22E5E9d8BAf0edAc6f37da032`）との互換性をテストする
  - Hardhat Ignition デプロイスクリプトを作成し、Groth16Verifier → VoiceWalletFactory の順で Base Sepolia にデプロイする
  - デプロイ後のコントラクトアドレスを環境変数として記録する
  - _Requirements: 3.3_

## Task 4. MCP サーバー — ツール実装

- [x] 4.1 MCP サーバーのセットアップ
  - 既存の Hono サーバー骨格に @hono/mcp と @modelcontextprotocol/sdk を導入し、Streamable HTTP トランスポートで MCP サーバーを構築する
  - viem を導入して Base Sepolia RPC への接続を設定する
  - Backend Server への HTTP 通信用クライアントを設定する
  - 入力バリデーション用の Zod スキーマ定義のベース構造を整備する
  - MCP Inspector でサーバーの基本接続をテストする
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 4.2 (P) 声の特徴量抽出とウォレット生成ツールの実装
  - `extract_voice_features` ツールを実装し、音声データを Backend の /extract-features エンドポイントに転送して特徴量を返却する
  - `generate_zk_wallet` ツールを実装し、特徴量から Backend の /generate-proof を呼び出して ZK 証明を生成し、VoiceWalletFactory の getAddress でウォレットアドレスを算出して返却する
  - 各ツールの入力スキーマを Zod で定義する
  - エラー時は構造化されたエラーレスポンスを返却する
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.4, 7.2, 7.5_

- [x] 4.3 (P) 残高・アドレス・QR コードツールの実装
  - `get_wallet_balance` ツールを実装し、viem で ETH 残高と USDC（ERC-20）残高を取得してユーザーフレンドリーな形式（"0.5 ETH", "100 USDC"）で返却する
  - ウォレットアドレスにコードが存在しない場合はウォレット未作成として通知する
  - `get_wallet_address` ツールを実装し、commitment から Factory の getAddress で導出したウォレットアドレスをチェックサム形式で返却する
  - `show_wallet_qrcode` ツールを実装し、EIP-681 形式のペイメントリンクを含む QR コード用データを生成して返却する
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.4, 7.2, 7.5_

- [x] 4.4 トークン送金ツールの実装
  - `transfer_tokens` ツールを実装し、ETH 送金と USDC（ERC-20 transfer）送金の両方に対応する
  - ZK Proof データを含む UserOperation を構築し、EntryPoint 経由でトランザクションを送信する
  - 送金前に残高チェックを行い、不足時はエラーを返却する
  - トランザクション送信後は txHash とステータスを返却する
  - 送金確認（二重確認）のフローは ElevenLabs Agent の会話ロジックに委譲する
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6, 7.2, 7.5_

## Task 5. フロントエンド — 音声 AI エージェント UI

- [x] 5.1 (P) デザインシステム基盤の構築
  - 設計デザインファイル(`design/ui_design.pen`)を参照する
  - Tailwind CSS と shadcn/ui をプロジェクトに導入し、ビルド設定を更新する
  - カスタムデザインテーマを設定する：個性的なフォント（JetBrains Mono / Space Grotesk）、大胆なブランドカラー、CSS 変数によるテーマ管理
  - レイヤードグラデーションや幾何学パターンの背景スタイルを定義する
  - Framer Motion を導入し、ページロード時のスタガードアニメーションの基本設定を整備する
  - レスポンシブデザインのブレークポイントを定義する
  - _Requirements: 9.1, 9.2, 9.6_

- [x] 5.2 VoiceOrb コンポーネントの構築
  - 設計デザインファイル(`design/ui_design.pen`)を参照する
  - 音声会話の中核となるビジュアルフィードバックコンポーネントを作成する
  - 接続状態（切断/接続中/接続済み）と発話状態（待機/リスニング/スピーキング/シンキング）に応じた波形・パルスアニメーションを実装する
  - CSS アニメーションと Framer Motion を組み合わせて、声に反応するオーブ（球体）のビジュアルを表現する
  - マイクの音声レベルに連動したリアクティブなアニメーションを実装する
  - _Requirements: 8.5, 9.3_

- [x] 5.3 ウォレット操作カードコンポーネントの構築
  - 設計デザインファイル(`design/ui_design.pen`)を参照する
  - WalletCard: 残高（ETH/USDC）とウォレットアドレスをリッチなカード形式で表示するコンポーネントを作成する
  - QRCodeCard: EIP-681 ペイメントリンク付き QR コードを表示するコンポーネントを作成する
  - ElevenLabs UIの使用を検討する
    - https://ui.elevenlabs.io/docs
  - TransactionCard: トランザクションの処理状況（確認中/送信中/完了/失敗）をリアルタイムに表示するコンポーネントを作成する
  - MessageLog: 会話履歴をリアルタイム表示し、ツール結果をインラインカードとして表示するコンポーネントを作成する
  - 全カードコンポーネントに shadcn/ui のデザインシステムとアニメーションを適用する
  - _Requirements: 5.2, 5.3, 6.3, 8.3, 8.4, 9.4_

- [ ] 5.4 ElevenLabs Agent 統合とアプリケーション統合
  - 設計デザインファイル(`design/ui_design.pen`)を参照する
  - 既存の App.tsx をリファクタリングし、VoiceOrb・MessageLog・各カードコンポーネントを統合する
  - ElevenLabs useConversation フックの WebRTC/WebSocket 接続を維持しつつ、状態管理を新しいコンポーネント構造に適応させる
  - Agent からのツール結果コールバックを解析し、適切なカードコンポーネント（残高/アドレス/QR/トランザクション）を表示するロジックを実装する
  - ElevenLabs ダッシュボードで Mistral AI を Custom LLM として設定し、MCP サーバーをツールとして接続する
  - Agent のシステムプロンプトに送金時の音声二重確認フローを含める
  - PWA 設定を維持し、Vercel デプロイ対応を確認する
  - _Requirements: 8.1, 8.2, 8.6, 9.5, 11.5_

## Task 6. エンドツーエンド統合とセキュリティ検証

- [ ] 6.1 ウォレット登録フローの統合テスト
  - 音声入力 → 特徴量抽出（Backend）→ ZK 証明生成（Backend）→ ウォレットアドレス算出（MCP Server + Factory）→ UI 表示（Frontend）の全フローを通して動作確認する
  - MCP Server と Backend 間の通信が正しく動作することを検証する
  - 同一の音声から常に同一のウォレットアドレスが導出されることを確認する
  - _Requirements: 1.1, 2.1, 3.1, 3.4_

- [ ] 6.2 送金フローの統合テスト
  - 音声での送金指示 → 声の認証（ZK Proof）→ UserOperation 構築 → トランザクション送信 → 結果表示の全フローを通して動作確認する
  - ETH 送金と USDC 送金の両方を検証する
  - 残高不足時のエラーハンドリングを確認する
  - Agent による送金前の音声二重確認が機能することを検証する
  - _Requirements: 6.1, 6.2, 6.5, 6.6, 11.5_

- [ ] 6.3 セキュリティとプライバシーの検証
  - 声の生音声データと特徴量ベクトルがオンチェーンに保存されていないことを確認する（コントラクトストレージの検査）
  - オンチェーンに保存されるデータがコミットメント（Poseidon ハッシュ出力）のみであることを検証する
  - Backend が処理完了後に音声データと特徴量をメモリから破棄していることを確認する
  - VoiceWallet が有効な ZK Proof なしにはウォレット操作を許可しないことを検証する（無効な Proof での revert テスト）
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.6_
