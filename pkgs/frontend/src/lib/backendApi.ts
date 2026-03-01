const BACKEND_BASE_URL =
  typeof import.meta.env.VITE_BACKEND_URL === "string" &&
  import.meta.env.VITE_BACKEND_URL.length > 0
    ? import.meta.env.VITE_BACKEND_URL
    : "http://localhost:5000";

const REQUEST_TIMEOUT_MS = 30_000;

export type ExtractFeaturesResponse = {
  features: number[];
  binaryFeatures: number[];
  packedFeatures: number[];
  format?: string;
  modelUsed?: string;
};

type BackendErrorShape = {
  error?: {
    code?: string;
    message?: string;
  };
};

export const extractVoiceFeatures = async (
  audioBase64: string,
  mimeType?: string,
): Promise<ExtractFeaturesResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${BACKEND_BASE_URL}/extract-features`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audio: audioBase64,
        mimeType,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const raw = await response.text();
      let parsed: BackendErrorShape | undefined;
      try {
        parsed = JSON.parse(raw) as BackendErrorShape;
      } catch {
        parsed = undefined;
      }
      const detail =
        parsed?.error?.message || raw || `HTTP ${response.status.toString()}`;
      throw new Error(`Backend ${response.status.toString()}: ${detail}`);
    }

    return (await response.json()) as ExtractFeaturesResponse;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Backend request timed out after 30 seconds");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};
