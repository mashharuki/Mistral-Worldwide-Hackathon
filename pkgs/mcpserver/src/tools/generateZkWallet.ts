import { randomBytes } from "node:crypto";
import { backendClient } from "../lib/backendClient.js";
import { viemClient } from "../lib/viemClient.js";
import {
  VOICE_WALLET_FACTORY_ADDRESS,
  VOICE_OWNERSHIP_VERIFIER_ADDRESS,
  ENTRYPOINT_ADDRESS,
  voiceWalletFactoryAbi,
} from "../lib/contracts.js";

/**
 * generate_zk_wallet ツールハンドラー
 *
 * 1. Backend の /generate-commitment で Poseidon コミットメントを生成
 * 2. VoiceWalletFactory の getAddress で決定論的ウォレットアドレスを算出
 */
export async function handleGenerateZkWallet({
  features,
  salt,
}: {
  features: number[];
  salt?: string;
}) {
  try {
    // salt が未指定の場合はランダム生成
    const resolvedSalt =
      salt ?? `0x${randomBytes(32).toString("hex")}`;

    // Backend でコミットメントを生成
    const commitmentResult = await backendClient.generateCommitment({
      features,
      salt: resolvedSalt,
    });

    // Factory の getAddress でウォレットアドレスを算出
    // commitment を bytes32 にパディング
    const commitmentBytes32 = commitmentResult.commitment.startsWith("0x")
      ? (commitmentResult.commitment as `0x${string}`)
      : (`0x${commitmentResult.commitment}` as `0x${string}`);

    // salt を bytes32 に変換
    const saltBytes32 = resolvedSalt.startsWith("0x")
      ? (resolvedSalt as `0x${string}`)
      : (`0x${resolvedSalt}` as `0x${string}`);

    const walletAddress = await viemClient.readContract({
      address: VOICE_WALLET_FACTORY_ADDRESS,
      abi: voiceWalletFactoryAbi,
      functionName: "getAddress",
      args: [
        ENTRYPOINT_ADDRESS,
        VOICE_OWNERSHIP_VERIFIER_ADDRESS,
        commitmentBytes32,
        saltBytes32,
      ],
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            walletAddress,
            commitment: commitmentResult.commitment,
            salt: resolvedSalt,
            packedFeatures: commitmentResult.packedFeatures,
          }),
        },
      ],
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
    };
  }
}
