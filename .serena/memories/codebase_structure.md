# コードベース構造

## ルート
```
/
├── pkgs/                          # ワークスペースパッケージ
│   ├── frontend/                  # React 19 + Vite 7 (ElevenLabs 音声 UI)
│   │   └── src/                   # App.tsx, main.tsx, sw.ts
│   ├── backend/                   # Python Flask (ZK 証明生成 API)
│   │   ├── src/                   # app.py, feature_extraction.py, proof_generation.py
│   │   ├── tests/                 # unittest
│   │   ├── zk/                    # ZK 成果物 (.wasm, .zkey)
│   │   ├── samples/               # サンプルデータ
│   │   └── scripts/               # デプロイ・コピースクリプト
│   ├── contract/                  # Solidity (Hardhat)
│   │   ├── contracts/             # VoiceWallet.sol, Verifier 等
│   │   │   ├── interfaces/        # IVoiceWallet.sol, IGroth16Verifier.sol
│   │   │   └── mocks/             # テスト用モック
│   │   └── test/                  # VoiceWallet.test.ts
│   ├── circuit/                   # Circom ZK 回路
│   │   ├── src/                   # VoiceCommitment.circom, VoiceOwnership.circom
│   │   ├── test/                  # 回路テスト
│   │   └── scripts/               # コンパイル・証明スクリプト
│   └── mcpserver/                 # Hono MCP サーバー
│       └── src/index.ts
├── .kiro/                         # Kiro Spec Driven Development
│   ├── steering/                  # product.md, tech.md, structure.md
│   └── specs/voice-zk-wallet/     # アクティブ仕様 (requirements, design, tasks)
├── biome.json                     # Biome 設定 (フォーマット/リント)
├── pnpm-workspace.yaml            # pnpm ワークスペース
└── package.json                   # ルートスクリプト + Biome 依存
```

## 重要なデータフロー
1. 音声 → feature_extraction.py → 声の特徴量
2. 特徴量 → Circom (VoiceCommitment) → Poseidon コミットメント
3. コミットメント → VoiceWallet (ERC-4337) → 決定論的ウォレットアドレス
4. 所有権証明: VoiceOwnership 回路 → Groth16 証明 → オンチェーン検証
