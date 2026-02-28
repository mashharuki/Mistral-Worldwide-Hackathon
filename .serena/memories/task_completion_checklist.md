# タスク完了時チェックリスト

## 共通
1. `pnpm format` — Biome フォーマット
2. `pnpm lint` — Biome リント

## TypeScript (frontend / mcpserver) 変更時
3. `pnpm frontend build` or `pnpm mcpserver build` — ビルド確認

## Python (backend) 変更時
3. `pnpm backend format:check` — Black フォーマットチェック
4. `pnpm backend test` — unittest 実行

## Solidity (contract) 変更時
3. `pnpm contract compile` — コンパイル確認
4. `pnpm contract test` — Hardhat テスト実行

## Circom (circuit) 変更時
3. `pnpm circuit compile` — 回路コンパイル
4. `pnpm circuit test` — 回路テスト実行
5. `pnpm circuit cp:zk` — 成果物コピー（必要時）

## 全般
- 新規ファイル追加時は .gitignore 確認
- 環境変数追加時は .env.example も更新
- 仕様変更時は .kiro/specs/ のドキュメントも更新
