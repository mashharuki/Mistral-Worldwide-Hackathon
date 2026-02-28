# コードスタイル・規約

## フォーマッター/リンター
- **TypeScript/JS**: Biome (ルート biome.json)
  - インデント: スペース
  - 引用符: ダブルクォート
  - import 自動整理: 有効 (organizeImports)
  - 推奨ルール有効
- **Solidity**: solhint
- **Python**: Black

## 命名規則
- **ファイル名**: kebab-case（一般）、PascalCase（Circom テンプレート名に準拠）
- **React コンポーネント**: PascalCase
- **関数/変数**: camelCase (TypeScript), snake_case (Python)
- **Circom テンプレート**: PascalCase (e.g., VoiceCommitment, VoiceOwnership)
- **Solidity コントラクト**: PascalCase (e.g., VoiceWallet)

## TypeScript
- strict mode
- ESM (type: "module") — frontend, mcpserver
- CommonJS — circuit (type: "commonjs")

## Solidity
- バージョン: 0.8.28
- OpenZeppelin v5 使用
- ERC-4337 Account Abstraction 対応

## Python
- Flask 3.0 + flask-cors
- src/ ディレクトリにソースコード配置
- tests/ ディレクトリにテスト配置
- unittest フレームワーク

## Import 規約
Biome の organizeImports で自動整理。外部パッケージ → ローカルファイルの順。

## 環境変数
- .env ファイルで管理 (gitignore 対象)
- .env.example を参考に設定
- dotenv で読み込み

## 開発言語規約 (AGENTS.md)
- 思考は英語、レスポンスは日本語
- 仕様ドキュメントは spec.json.language に従う (現在 "ja")
