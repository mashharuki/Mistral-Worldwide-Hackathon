# 開発コマンド一覧

## ワークスペースルート
```bash
pnpm install                 # 依存関係インストール
pnpm format                  # Biome フォーマット (全体)
pnpm lint                    # Biome リント (全体)
```

## フロントエンド (pkgs/frontend)
```bash
pnpm frontend dev            # Vite 開発サーバー起動
pnpm frontend build          # TypeScript + Vite ビルド
pnpm frontend preview        # ビルド済みプレビュー
```

## バックエンド (pkgs/backend) — Python
```bash
cd pkgs/backend
pip install -r requirements.txt    # Python 依存インストール
python3 src/app.py                 # Flask サーバー起動
pnpm backend test                  # unittest 実行
pnpm backend format                # Black フォーマット
pnpm backend format:check          # Black チェック
pnpm backend docker:build          # Docker イメージビルド
pnpm backend docker:run            # Docker コンテナ実行 (8080)
pnpm backend cloudrun:deploy       # Cloud Run デプロイ
```

## コントラクト (pkgs/contract) — Solidity
```bash
pnpm contract compile        # Hardhat コンパイル
pnpm contract test           # Hardhat テスト実行
pnpm contract coverage       # Solidity カバレッジ
pnpm contract format         # solhint フォーマット
pnpm contract clean          # Hardhat クリーン
pnpm contract local          # ローカルノード起動
pnpm contract verify         # Etherscan 検証
```

## ZK 回路 (pkgs/circuit) — Circom
```bash
pnpm circuit compile         # Circom 回路コンパイル
pnpm circuit generateWitness # Witness 生成
pnpm circuit executeGroth16  # Groth16 証明実行
pnpm circuit generateInput   # テスト入力生成
pnpm circuit test            # 回路テスト (VoiceCommitment + VoiceOwnership)
pnpm circuit cp:zk           # ZK 成果物をフロントエンド/バックエンドにコピー
pnpm circuit cp:verifier     # Verifier をコピー
```

## MCP サーバー (pkgs/mcpserver) — Hono
```bash
pnpm mcpserver dev           # tsx watch 開発サーバー
pnpm mcpserver build         # TypeScript ビルド
pnpm mcpserver start         # dist/index.js 起動
```

## Git / システムユーティリティ (macOS / Darwin)
```bash
git status                   # 変更確認
git log --oneline -10        # 直近コミット
git diff                     # 差分表示
```
