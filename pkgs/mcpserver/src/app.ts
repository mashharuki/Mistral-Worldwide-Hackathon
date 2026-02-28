import { StreamableHTTPTransport } from "@hono/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Hono } from "hono";
import {
  extractVoiceFeaturesInput,
  generateZkWalletInput,
  getWalletAddressInput,
  getWalletBalanceInput,
  showWalletQrcodeInput,
  transferTokensInput,
} from "./lib/schemas.js";
import { handleExtractVoiceFeatures } from "./tools/extractVoiceFeatures.js";
import { handleGenerateZkWallet } from "./tools/generateZkWallet.js";
import { handleGetWalletAddress } from "./tools/getWalletAddress.js";
import { handleGetWalletBalance } from "./tools/getWalletBalance.js";
import { handleShowWalletQrcode } from "./tools/showWalletQrcode.js";

/**
 * 6 ツールを登録した McpServer を生成する
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "voice-zk-wallet-mcp",
    version: "0.1.0",
    description: "音声特徴量から ZK ウォレットを生成する MCP サーバー",
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
    async ({ features, salt }) =>
      handleGenerateZkWallet({ features, salt }),
  );

  // --- Tool 3: get_wallet_balance ---
  server.registerTool(
    "get_wallet_balance",
    {
      title: "ウォレット残高取得",
      description:
        "指定ウォレットの ETH / USDC 残高をフレンドリーな形式で返却します",
      inputSchema: getWalletBalanceInput,
    },
    async ({ walletAddress }) =>
      handleGetWalletBalance({ walletAddress }),
  );

  // --- Tool 4: get_wallet_address ---
  server.registerTool(
    "get_wallet_address",
    {
      title: "ウォレットアドレス取得",
      description:
        "声のコミットメントから Factory 経由でウォレットアドレスを算出します",
      inputSchema: getWalletAddressInput,
    },
    async ({ commitment }) =>
      handleGetWalletAddress({ commitment }),
  );

  // --- Tool 5: show_wallet_qrcode ---
  server.registerTool(
    "show_wallet_qrcode",
    {
      title: "QR コード表示",
      description:
        "ウォレットアドレスの EIP-681 ペイメントリンク付き QR コードデータを生成します",
      inputSchema: showWalletQrcodeInput,
    },
    async ({ walletAddress }) =>
      handleShowWalletQrcode({ walletAddress }),
  );

  // --- Tool 6: transfer_tokens ---
  server.registerTool(
    "transfer_tokens",
    {
      title: "トークン送金",
      description:
        "ZK Proof を含む UserOperation で ETH または USDC を送金します",
      inputSchema: transferTokensInput,
    },
    async ({ from, to, amount, token, proof }) => {
      // TODO: Task 4.4 で実装
      return {
        content: [
          { type: "text" as const, text: "Not implemented yet" },
        ],
        isError: true,
      };
    },
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
