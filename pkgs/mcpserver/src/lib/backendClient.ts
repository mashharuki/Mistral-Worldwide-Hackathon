const BACKEND_BASE_URL = process.env.BACKEND_URL ?? "http://localhost:5000";

interface ExtractFeaturesResponse {
  features: number[];
  binaryFeatures: number[];
  packedFeatures?: number[];
  format?: string;
  modelUsed?: string;
}

interface GenerateProofResponse {
  proof: {
    a: string[];
    b: string[][];
    c: string[];
  };
  publicSignals: string[];
  commitment: string;
  hammingDistance?: number;
}

interface GenerateCommitmentResponse {
  commitment: string;
  packedFeatures: string[];
}

interface HealthResponse {
  status: string;
}

/**
 * バックエンドにリクエストを送るためのユーティリティ関数
 * @param path
 * @param options
 * @returns
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BACKEND_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Backend ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/**
 * バックエンドAPIを呼び出すためのクライアントオブジェクト
 */
export const backendClient = {
  baseUrl: BACKEND_BASE_URL,

  /**
   * 声紋特徴量を抽出するAPIを呼び出す
   * @param audio
   * @returns
   */
  async extractFeatures(audio: string): Promise<ExtractFeaturesResponse> {
    return request<ExtractFeaturesResponse>("/extract-features", {
      method: "POST",
      body: JSON.stringify({ audio }),
    });
  },

  /**
   * ZK証明を生成するAPIを呼び出す
   * @param params
   * @returns
   */
  async generateProof(params: {
    referenceFeatures: number[];
    currentFeatures: number[];
    salt: string;
  }): Promise<GenerateProofResponse> {
    return request<GenerateProofResponse>("/generate-proof", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /**
   * コミットメントを生成するAPIを呼び出す
   * @param params
   * @returns
   */
  async generateCommitment(params: {
    features: number[];
    salt: string;
  }): Promise<GenerateCommitmentResponse> {
    return request<GenerateCommitmentResponse>("/generate-commitment", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /**
   * ヘルスチェックAPIを呼び出す
   * @returns
   */
  async health(): Promise<HealthResponse> {
    return request<HealthResponse>("/health");
  },
};
