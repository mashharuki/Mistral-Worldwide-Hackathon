import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";
import {
  createWalletInput,
  extractVoiceFeaturesInput,
  generateZkProofInput,
  generateZkWalletInput,
  getWalletAddressInput,
  getWalletBalanceInput,
  showWalletQrcodeInput,
  transferTokensInput,
} from "./lib/schemas.js";
import { handleCreateWallet } from "./tools/createWallet.js";
import { handleExtractVoiceFeatures } from "./tools/extractVoiceFeatures.js";
import { handleGenerateZkProof } from "./tools/generateZkProof.js";
import { handleGenerateZkWallet } from "./tools/generateZkWallet.js";
import { handleGetWalletAddress } from "./tools/getWalletAddress.js";
import { handleGetWalletBalance } from "./tools/getWalletBalance.js";
import { handleShowWalletQrcode } from "./tools/showWalletQrcode.js";
import { handleTransferTokens } from "./tools/transferTokens.js";

/**
 * 8 ツールを登録した McpServer を生成する
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "voice-zk-wallet-mcp",
    version: "0.1.0",
    description:
      "音声特徴量抽出・ZKウォレット生成・残高/アドレス/QR取得・トークン送金を提供する MCP サーバー",
  });

  // --- Tool 1: extract_voice_features ---
  server.registerTool(
    "extract_voice_features",
    {
      title: "音声特徴量抽出",
      description:
        "音声データから話者の特徴量を抽出し、二値化したバイナリベクトルを返却します",
      inputSchema: extractVoiceFeaturesInput,
    },
    async ({ audio }) => handleExtractVoiceFeatures({ audio }),
  );

  // --- Tool 2: generate_zk_wallet ---
  server.registerTool(
    "generate_zk_wallet",
    {
      title: "ZK ウォレット生成",
      description:
        "声の特徴量から ZK 証明を生成し、決定論的にウォレットアドレスを算出します",
      inputSchema: generateZkWalletInput,
    },
    async ({ features, salt }) => handleGenerateZkWallet({ features, salt }),
  );

  // --- Tool 3: create_wallet ---
  server.registerTool(
    "create_wallet",
    {
      title: "ウォレットデプロイ",
      description:
        "commitment と salt を使って Factory.createWallet を実行し、ウォレットをデプロイします",
      inputSchema: createWalletInput,
    },
    async ({ commitment, salt }) => handleCreateWallet({ commitment, salt }),
  );

  // --- Tool 4: generate_zk_proof ---
  server.registerTool(
    "generate_zk_proof",
    {
      title: "ZK 証明生成",
      description:
        "登録時特徴量と現在特徴量・salt から送金用の ZK proof を生成します",
      inputSchema: generateZkProofInput,
    },
    async ({ referenceFeatures, currentFeatures, salt }) =>
      handleGenerateZkProof({ referenceFeatures, currentFeatures, salt }),
  );

  // --- Tool 5: get_wallet_balance ---
  server.registerTool(
    "get_wallet_balance",
    {
      title: "ウォレット残高取得",
      description:
        "指定ウォレットの ETH / USDC 残高をフレンドリーな形式で返却します",
      inputSchema: getWalletBalanceInput,
    },
    async ({ walletAddress }) => handleGetWalletBalance({ walletAddress }),
  );

  // --- Tool 6: get_wallet_address ---
  server.registerTool(
    "get_wallet_address",
    {
      title: "ウォレットアドレス取得",
      description:
        "声のコミットメントから Factory 経由でウォレットアドレスを算出します",
      inputSchema: getWalletAddressInput,
    },
    async ({ commitment }) => handleGetWalletAddress({ commitment }),
  );

  // --- Tool 7: show_wallet_qrcode ---
  server.registerTool(
    "show_wallet_qrcode",
    {
      title: "QR コード表示",
      description:
        "ウォレットアドレスの EIP-681 ペイメントリンク付き QR コードデータを生成します",
      inputSchema: showWalletQrcodeInput,
    },
    async ({ walletAddress }) => handleShowWalletQrcode({ walletAddress }),
  );

  // --- Tool 8: transfer_tokens ---
  server.registerTool(
    "transfer_tokens",
    {
      title: "トークン送金",
      description:
        "ZK Proof を含む UserOperation で ETH / USDC を送金し、オンチェーン状態を更新します（残高不足や証明不正時はエラー）",
      inputSchema: transferTokensInput,
    },
    async ({ from, to, amount, token, proof }) =>
      handleTransferTokens({ from, to, amount, token, proof }),
  );

  return server;
}

// --- Hono App ---
export const app = new Hono();

// ヘルスチェック
app.get("/", (c) => c.json({ status: "ok" }));
app.get("/health", (c) => c.json({ status: "ok" }));

// MCP Streamable HTTP エンドポイント（ステートレスモード）
app.all("/mcp", async (c) => {
  const transport = new StreamableHTTPTransport();
  const server = createMcpServer();
  await server.connect(transport);
  return transport.handleRequest(c);
});
