import { backendClient } from "../lib/backendClient.js";

/**
 * extract_voice_features ツールハンドラー
 *
 * 音声データを Backend の /extract-features に転送し、
 * 特徴量とバイナリベクトルを返却する。
 */
export async function handleExtractVoiceFeatures({ audio }: { audio: string }) {
  try {
    const result = await backendClient.extractFeatures(audio);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            features: result.features,
            binaryFeatures: result.binaryFeatures,
            packedFeatures: result.packedFeatures,
            modelUsed: result.modelUsed,
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
