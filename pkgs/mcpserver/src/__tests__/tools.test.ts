import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMcpServer } from "../app.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

// backendClient をモック
vi.mock("../lib/backendClient.js", () => ({
  backendClient: {
    baseUrl: "http://localhost:5000",
    extractFeatures: vi.fn(),
    generateProof: vi.fn(),
    generateCommitment: vi.fn(),
    health: vi.fn(),
  },
}));

// viemClient をモック
vi.mock("../lib/viemClient.js", () => ({
  viemClient: {
    chain: { id: 84532, name: "Base Sepolia" },
    readContract: vi.fn(),
    getBalance: vi.fn(),
    getBytecode: vi.fn(),
  },
}));

import { backendClient } from "../lib/backendClient.js";
import { viemClient } from "../lib/viemClient.js";

async function createTestClient() {
  const server = createMcpServer();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { server, client };
}

describe("extract_voice_features tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call backend extractFeatures and return features", async () => {
    const mockResponse = {
      features: [123456789, 987654321, 111111111, 222222222, 333333333, 444444444, 555555555, 666666666],
      binaryFeatures: [1, 0, 1, 1, 0, 1],
    };
    vi.mocked(backendClient.extractFeatures).mockResolvedValue(mockResponse);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "extract_voice_features",
      arguments: { audio: "base64audiodata==" },
    });

    expect(backendClient.extractFeatures).toHaveBeenCalledWith(
      "base64audiodata==",
    );
    expect(result.isError).toBeFalsy();
    expect(result.content).toBeDefined();
    const textContent = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.features).toEqual(mockResponse.features);
    expect(parsed.binaryFeatures).toEqual(mockResponse.binaryFeatures);

    await client.close();
    await server.close();
  });

  it("should return structured error on backend failure", async () => {
    vi.mocked(backendClient.extractFeatures).mockRejectedValue(
      new Error("Backend 400: Audio quality too low"),
    );

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "extract_voice_features",
      arguments: { audio: "badaudio" },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{ type: string; text: string }>;
    expect(textContent[0].text).toContain("Audio quality too low");

    await client.close();
    await server.close();
  });
});

describe("generate_zk_wallet tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call backend generateCommitment and factory getAddress", async () => {
    const mockCommitmentResponse = {
      commitment: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      packedFeatures: ["123456789", "987654321", "111111111", "222222222", "333333333", "444444444", "555555555", "666666666"],
    };
    vi.mocked(backendClient.generateCommitment).mockResolvedValue(
      mockCommitmentResponse,
    );

    const mockWalletAddress = "0x1234567890123456789012345678901234567890";
    vi.mocked(viemClient.readContract).mockResolvedValue(mockWalletAddress);

    const { server, client } = await createTestClient();
    const features = [123456789, 987654321, 111111111, 222222222, 333333333, 444444444, 555555555, 666666666];
    const result = await client.callTool({
      name: "generate_zk_wallet",
      arguments: { features, salt: "0xabc123" },
    });

    expect(backendClient.generateCommitment).toHaveBeenCalledWith({
      features,
      salt: "0xabc123",
    });
    expect(viemClient.readContract).toHaveBeenCalled();

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.walletAddress).toBe(mockWalletAddress);
    expect(parsed.commitment).toBe(mockCommitmentResponse.commitment);

    await client.close();
    await server.close();
  });

  it("should generate a random salt when not provided", async () => {
    const mockCommitmentResponse = {
      commitment: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      packedFeatures: ["1", "2", "3", "4", "5", "6", "7", "8"],
    };
    vi.mocked(backendClient.generateCommitment).mockResolvedValue(
      mockCommitmentResponse,
    );

    const mockWalletAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    vi.mocked(viemClient.readContract).mockResolvedValue(mockWalletAddress);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "generate_zk_wallet",
      arguments: { features: [1, 2, 3, 4, 5, 6, 7, 8] },
    });

    // salt は自動生成されるので generateCommitment に何らかの salt が渡される
    expect(backendClient.generateCommitment).toHaveBeenCalledWith(
      expect.objectContaining({
        features: [1, 2, 3, 4, 5, 6, 7, 8],
        salt: expect.any(String),
      }),
    );
    expect(result.isError).toBeFalsy();

    await client.close();
    await server.close();
  });

  it("should return structured error on backend failure", async () => {
    vi.mocked(backendClient.generateCommitment).mockRejectedValue(
      new Error("Backend 500: Internal server error"),
    );

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "generate_zk_wallet",
      arguments: { features: [1, 2, 3, 4, 5, 6, 7, 8] },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{ type: string; text: string }>;
    expect(textContent[0].text).toContain("Internal server error");

    await client.close();
    await server.close();
  });

  it("should return structured error on contract call failure", async () => {
    const mockCommitmentResponse = {
      commitment: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      packedFeatures: ["1", "2", "3", "4", "5", "6", "7", "8"],
    };
    vi.mocked(backendClient.generateCommitment).mockResolvedValue(
      mockCommitmentResponse,
    );
    vi.mocked(viemClient.readContract).mockRejectedValue(
      new Error("Contract call failed"),
    );

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "generate_zk_wallet",
      arguments: { features: [1, 2, 3, 4, 5, 6, 7, 8] },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{ type: string; text: string }>;
    expect(textContent[0].text).toContain("Contract call failed");

    await client.close();
    await server.close();
  });
});
