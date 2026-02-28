import { viemClient } from "../lib/viemClient.js";
import {
  VOICE_WALLET_FACTORY_ADDRESS,
  VOICE_OWNERSHIP_VERIFIER_ADDRESS,
  ENTRYPOINT_ADDRESS,
  voiceWalletFactoryAbi,
} from "../lib/contracts.js";

/**
 * get_wallet_address ツールハンドラー
 *
 * コミットメントから Factory.getAddress で決定論的ウォレットアドレスを算出する。
 * salt はデフォルト 0x0 を使用（generate_zk_wallet 時に指定した salt と一致させる必要あり）。
 */
export async function handleGetWalletAddress({
  commitment,
  salt,
}: {
  commitment: string;
  salt?: string;
}) {
  try {
    const commitmentBytes32 = commitment.startsWith("0x")
      ? (commitment as `0x${string}`)
      : (`0x${commitment}` as `0x${string}`);

    const saltBytes32 = salt
      ? salt.startsWith("0x")
        ? (salt as `0x${string}`)
        : (`0x${salt}` as `0x${string}`)
      : ("0x0000000000000000000000000000000000000000000000000000000000000000" as `0x${string}`);

    const address = await viemClient.readContract({
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
          text: JSON.stringify({ address }),
        },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
    };
  }
}
