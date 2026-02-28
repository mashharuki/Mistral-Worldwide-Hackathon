import * as z from "zod";

export const extractVoiceFeaturesInput = {
  audio: z.string().describe("Base64 エンコードされた音声データ"),
};

export const generateZkWalletInput = {
  features: z.array(z.number()).describe("64bit パッキングされた特徴量配列 (8要素)"),
  salt: z.string().optional().describe("ソルト値（省略時はランダム生成）"),
};

export const getWalletBalanceInput = {
  walletAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .describe("ウォレットアドレス"),
};

export const getWalletAddressInput = {
  commitment: z.string().describe("声のコミットメント値"),
};

export const showWalletQrcodeInput = {
  walletAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .describe("ウォレットアドレス"),
};

export const transferTokensInput = {
  from: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .describe("送金元ウォレットアドレス"),
  to: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .describe("送金先アドレス"),
  amount: z.string().describe("送金額（ETH / USDC の文字列表記）"),
  token: z.enum(["ETH", "USDC"]).describe("送金トークン種別"),
  proof: z.string().describe("ZK Proof データ（JSON 文字列）"),
};
