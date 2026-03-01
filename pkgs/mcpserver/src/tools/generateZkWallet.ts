import { randomBytes } from "node:crypto";
import { backendClient } from "../lib/backendClient.js";
import { viemClient } from "../lib/viemClient.js";
import {
  VOICE_WALLET_FACTORY_ADDRESS,
  VOICE_OWNERSHIP_VERIFIER_ADDRESS,
  ENTRYPOINT_ADDRESS,
  voiceWalletFactoryAbi,
} from "../lib/contracts.js";

const UINT256_MAX = (1n << 256n) - 1n;

function resolveSalt(salt?: string): {
  decimal: string;
  hexBytes32: `0x${string}`;
} {
  let value: bigint;
  if (salt === undefined || salt.trim() === "") {
    value = BigInt(`0x${randomBytes(32).toString("hex")}`);
  } else {
    const trimmed = salt.trim();
    if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
      value = BigInt(trimmed);
    } else if (/^\d+$/.test(trimmed)) {
      value = BigInt(trimmed);
    } else {
      throw new Error(
        "salt must be a hex string (0x...) or non-negative integer string",
      );
    }
  }

  if (value < 0n || value > UINT256_MAX) {
    throw new Error("salt must be in uint256 range");
  }

  return {
    decimal: value.toString(10),
    hexBytes32: `0x${value.toString(16).padStart(64, "0")}` as `0x${string}`,
  };
}

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
    const resolvedSalt = resolveSalt(salt);

    // Backend でコミットメントを生成
    const commitmentResult = await backendClient.generateCommitment({
      features,
      salt: resolvedSalt.decimal,
    });

    // Factory の getAddress でウォレットアドレスを算出
    const commitmentBytes32 = resolveUint256ToBytes32(
      commitmentResult.commitment,
      "commitment",
    );

    const walletAddress = await viemClient.readContract({
      address: VOICE_WALLET_FACTORY_ADDRESS,
      abi: voiceWalletFactoryAbi,
      functionName: "getAddress",
      args: [
        ENTRYPOINT_ADDRESS,
        VOICE_OWNERSHIP_VERIFIER_ADDRESS,
        commitmentBytes32,
        resolvedSalt.hexBytes32,
      ],
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            walletAddress,
            commitment: commitmentResult.commitment,
            salt: resolvedSalt.hexBytes32,
            saltDecimal: resolvedSalt.decimal,
            packedFeatures: commitmentResult.packedFeatures,
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
