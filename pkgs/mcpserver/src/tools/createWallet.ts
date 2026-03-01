import { viemClient } from "../lib/viemClient.js";
import { relayerClient } from "../lib/relayerClient.js";
import {
  ENTRYPOINT_ADDRESS,
  VOICE_OWNERSHIP_VERIFIER_ADDRESS,
  VOICE_WALLET_FACTORY_ADDRESS,
  voiceWalletFactoryAbi,
} from "../lib/contracts.js";

const UINT256_MAX = (1n << 256n) - 1n;

function resolveUint256ToBytes32(
  value: string,
  fieldName: string,
): `0x${string}` {
  const trimmed = value.trim();
  let parsed: bigint;
  if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
    parsed = BigInt(trimmed);
  } else if (/^\d+$/.test(trimmed)) {
    parsed = BigInt(trimmed);
  } else {
    throw new Error(
      `${fieldName} must be a hex string (0x...) or non-negative integer string`,
    );
  }

  if (parsed < 0n || parsed > UINT256_MAX) {
    throw new Error(`${fieldName} must be in uint256 range`);
  }

  return `0x${parsed.toString(16).padStart(64, "0")}` as `0x${string}`;
}

/**
 * create_wallet ツールハンドラー
 *
 * 1. commitment/salt から Factory.getAddress で予測アドレスを取得
 * 2. Factory.createWallet を送信してウォレットをデプロイ
 */
export async function handleCreateWallet({
  commitment,
  salt,
}: {
  commitment: string;
  salt: string;
}) {
  try {
    if (!relayerClient) {
      return {
        content: [
          {
            type: "text" as const,
            text: "Relayer が設定されていません。RELAYER_PRIVATE_KEY 環境変数を設定してください。",
          },
        ],
        isError: true,
      };
    }

    const commitmentBytes32 = resolveUint256ToBytes32(commitment, "commitment");
    const saltBytes32 = resolveUint256ToBytes32(salt, "salt");

    const walletAddress = (await viemClient.readContract({
      address: VOICE_WALLET_FACTORY_ADDRESS,
      abi: voiceWalletFactoryAbi,
      functionName: "getAddress",
      args: [
        ENTRYPOINT_ADDRESS,
        VOICE_OWNERSHIP_VERIFIER_ADDRESS,
        commitmentBytes32,
        saltBytes32,
      ],
    })) as `0x${string}`;

    const bytecodeBefore = await viemClient.getBytecode({
      address: walletAddress,
    });
    if (bytecodeBefore && bytecodeBefore !== "0x") {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              walletAddress,
              commitment: commitmentBytes32,
              salt: saltBytes32,
              alreadyDeployed: true,
              message: "ウォレットは既にデプロイ済みです。",
            }),
          },
        ],
      };
    }

    const txHash = await relayerClient.writeContract({
      address: VOICE_WALLET_FACTORY_ADDRESS,
      abi: voiceWalletFactoryAbi,
      functionName: "createWallet",
      args: [
        ENTRYPOINT_ADDRESS,
        VOICE_OWNERSHIP_VERIFIER_ADDRESS,
        commitmentBytes32,
        saltBytes32,
      ],
    });

    const receipt = await viemClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const status = receipt.status === "success" ? "confirmed" : "failed";

    const bytecodeAfter = await viemClient.getBytecode({
      address: walletAddress,
    });
    const deployed = bytecodeAfter != null && bytecodeAfter !== "0x";

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            walletAddress,
            commitment: commitmentBytes32,
            salt: saltBytes32,
            txHash,
            status,
            deployed,
          }),
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
