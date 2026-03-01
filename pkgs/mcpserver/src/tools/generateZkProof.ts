import { backendClient } from "../lib/backendClient.js";

function normalizeSaltToDecimalString(salt: string): string {
  const trimmed = salt.trim();
  if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
    return BigInt(trimmed).toString(10);
  }
  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }
  throw new Error(
    "salt must be a hex string (0x...) or non-negative integer string",
  );
}

/**
 * generate_zk_proof ツールハンドラー
 *
 * Backend の /generate-proof を呼び出し、transfer_tokens で使える
 * proof/publicSignals を返す。
 */
export async function handleGenerateZkProof({
  referenceFeatures,
  currentFeatures,
  salt,
}: {
  referenceFeatures: number[];
  currentFeatures: number[];
  salt: string;
}) {
  try {
    const normalizedSalt = normalizeSaltToDecimalString(salt);
    const result = await backendClient.generateProof({
      referenceFeatures,
      currentFeatures,
      salt: normalizedSalt,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            proof: result.proof,
            publicSignals: result.publicSignals,
            commitment: result.commitment,
            hammingDistance: result.hammingDistance,
            saltDecimal: normalizedSalt,
            transferProof: JSON.stringify({
              proof: result.proof,
              publicSignals: result.publicSignals,
            }),
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
