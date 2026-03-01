import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMcpServer } from "../app.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { encodeErrorResult } from "viem";

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
    waitForTransactionReceipt: vi.fn(),
  },
}));

// relayerClient をモック
vi.mock("../lib/relayerClient.js", () => ({
  relayerClient: {
    writeContract: vi.fn(),
    account: { address: "0x0000000000000000000000000000000000000001" },
  },
}));

import { backendClient } from "../lib/backendClient.js";
import { viemClient } from "../lib/viemClient.js";
import { relayerClient } from "../lib/relayerClient.js";

const relayerClientMock = relayerClient!;

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
      features: [
        123456789, 987654321, 111111111, 222222222, 333333333, 444444444,
        555555555, 666666666,
      ],
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
      commitment:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      packedFeatures: [
        "123456789",
        "987654321",
        "111111111",
        "222222222",
        "333333333",
        "444444444",
        "555555555",
        "666666666",
      ],
    };
    vi.mocked(backendClient.generateCommitment).mockResolvedValue(
      mockCommitmentResponse,
    );

    const mockWalletAddress = "0x1234567890123456789012345678901234567890";
    vi.mocked(viemClient.readContract).mockResolvedValue(mockWalletAddress);

    const { server, client } = await createTestClient();
    const features = [
      123456789, 987654321, 111111111, 222222222, 333333333, 444444444,
      555555555, 666666666,
    ];
    const result = await client.callTool({
      name: "generate_zk_wallet",
      arguments: { features, salt: "0xabc123" },
    });

    expect(backendClient.generateCommitment).toHaveBeenCalledWith({
      features,
      salt: BigInt("0xabc123").toString(10),
    });
    expect(viemClient.readContract).toHaveBeenCalled();

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.walletAddress).toBe(mockWalletAddress);
    expect(parsed.commitment).toBe(mockCommitmentResponse.commitment);
    expect(parsed.salt).toBe(
      `0x${BigInt("0xabc123").toString(16).padStart(64, "0")}`,
    );
    expect(parsed.saltDecimal).toBe(BigInt("0xabc123").toString(10));

    await client.close();
    await server.close();
  });

  it("should generate a random salt when not provided", async () => {
    const mockCommitmentResponse = {
      commitment:
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
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
        salt: expect.stringMatching(/^\d+$/),
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
      commitment:
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
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

describe("create_wallet tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should deploy wallet when not deployed yet", async () => {
    const predictedWalletAddress = "0x1234567890123456789012345678901234567890";
    vi.mocked(viemClient.readContract).mockResolvedValue(
      predictedWalletAddress,
    );
    vi.mocked(viemClient.getBytecode)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce("0x6001600055");
    vi.mocked(relayerClientMock.writeContract).mockResolvedValue(
      "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    );
    vi.mocked(viemClient.waitForTransactionReceipt).mockResolvedValue({
      status: "success",
    } as never);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "create_wallet",
      arguments: {
        commitment:
          "18462540752726400309893078066476452350669854701354677931972054860563917542588",
        salt: "0xdc42cc0cee775b12ea4f0e2047d609046fba264ffd0b3537e855e24f481c62c7",
      },
    });

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.walletAddress).toBe(predictedWalletAddress);
    expect(parsed.deployed).toBe(true);
    expect(parsed.status).toBe("confirmed");
    expect(relayerClientMock.writeContract).toHaveBeenCalledTimes(1);

    await client.close();
    await server.close();
  });

  it("should skip deployment when wallet already deployed", async () => {
    const predictedWalletAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
    vi.mocked(viemClient.readContract).mockResolvedValue(
      predictedWalletAddress,
    );
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x6001600055");

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "create_wallet",
      arguments: {
        commitment: "12345",
        salt: "67890",
      },
    });

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.walletAddress).toBe(predictedWalletAddress);
    expect(parsed.alreadyDeployed).toBe(true);
    expect(relayerClientMock.writeContract).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });
});

describe("generate_zk_proof tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call backend generateProof and return transfer-ready payload", async () => {
    const mockResponse = {
      proof: {
        a: ["1", "2"],
        b: [
          ["3", "4"],
          ["5", "6"],
        ],
        c: ["7", "8"],
      },
      publicSignals: ["123456789"],
      commitment: "123456789",
      hammingDistance: 12,
    };
    vi.mocked(backendClient.generateProof).mockResolvedValue(
      mockResponse,
    );

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "generate_zk_proof",
      arguments: {
        referenceFeatures: [1, 2, 3, 4, 5, 6, 7, 8],
        currentFeatures: [1, 2, 3, 4, 5, 6, 7, 8],
        salt: "42",
      },
    });

    expect(backendClient.generateProof).toHaveBeenCalledWith({
      referenceFeatures: [1, 2, 3, 4, 5, 6, 7, 8],
      currentFeatures: [1, 2, 3, 4, 5, 6, 7, 8],
      salt: "42",
    });
    expect(result.isError).toBeFalsy();

    const textContent = result.content as Array<{ type: string; text: string }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.proof).toEqual(mockResponse.proof);
    expect(parsed.publicSignals).toEqual(mockResponse.publicSignals);
    expect(parsed.commitment).toBe(mockResponse.commitment);
    expect(typeof parsed.transferProof).toBe("string");

    await client.close();
    await server.close();
  });

  it("should return structured error on backend failure", async () => {
    vi.mocked(backendClient.generateProof).mockRejectedValue(
      new Error("Backend 400: proof generation failed"),
    );

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "generate_zk_proof",
      arguments: {
        referenceFeatures: [1, 2, 3, 4, 5, 6, 7, 8],
        currentFeatures: [1, 2, 3, 4, 5, 6, 7, 8],
        salt: "42",
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{ type: string; text: string }>;
    expect(textContent[0].text).toContain("proof generation failed");

    await client.close();
    await server.close();
  });
});

// ============================================================
// Task 4.3: get_wallet_balance, get_wallet_address, show_wallet_qrcode
// ============================================================

describe("get_wallet_balance tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return ETH and USDC balances in friendly format", async () => {
    // ETH balance: 0.5 ETH = 500000000000000000 wei
    vi.mocked(viemClient.getBalance).mockResolvedValue(500000000000000000n);
    // Bytecode exists -> wallet is deployed
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x1234");
    // USDC balance (6 decimals): 100 USDC = 100000000
    vi.mocked(viemClient.readContract).mockResolvedValue(100000000n);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "get_wallet_balance",
      arguments: {
        walletAddress: "0x1234567890123456789012345678901234567890",
      },
    });

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.eth).toBe("0.5 ETH");
    expect(parsed.usdc).toBe("100 USDC");

    await client.close();
    await server.close();
  });

  it("should notify when wallet is not deployed", async () => {
    vi.mocked(viemClient.getBalance).mockResolvedValue(0n);
    // No bytecode -> wallet not deployed
    vi.mocked(viemClient.getBytecode).mockResolvedValue(undefined);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "get_wallet_balance",
      arguments: {
        walletAddress: "0x1234567890123456789012345678901234567890",
      },
    });

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.walletDeployed).toBe(false);
    expect(parsed.message).toContain("未作成");

    await client.close();
    await server.close();
  });

  it("should return error on RPC failure", async () => {
    vi.mocked(viemClient.getBytecode).mockRejectedValue(new Error("RPC error"));

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "get_wallet_balance",
      arguments: {
        walletAddress: "0x1234567890123456789012345678901234567890",
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(textContent[0].text).toContain("RPC error");

    await client.close();
    await server.close();
  });
});

describe("get_wallet_address tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return checksum address from Factory getAddress", async () => {
    const mockAddress = "0xAbCdEf1234567890AbCdEf1234567890AbCdEf12";
    vi.mocked(viemClient.readContract).mockResolvedValue(mockAddress);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "get_wallet_address",
      arguments: {
        commitment:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      },
    });

    expect(viemClient.readContract).toHaveBeenCalled();
    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.address).toBe(mockAddress);

    await client.close();
    await server.close();
  });

  it("should return error on contract call failure", async () => {
    vi.mocked(viemClient.readContract).mockRejectedValue(
      new Error("Factory getAddress failed"),
    );

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "get_wallet_address",
      arguments: {
        commitment:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(textContent[0].text).toContain("Factory getAddress failed");

    await client.close();
    await server.close();
  });
});

describe("show_wallet_qrcode tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return EIP-681 URI and QR data", async () => {
    const { server, client } = await createTestClient();
    const walletAddress = "0x1234567890123456789012345678901234567890";
    const result = await client.callTool({
      name: "show_wallet_qrcode",
      arguments: { walletAddress },
    });

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    const parsed = JSON.parse(textContent[0].text);
    // EIP-681 format: ethereum:<address>@<chainId>
    expect(parsed.eip681Uri).toContain("ethereum:");
    expect(parsed.eip681Uri).toContain(walletAddress);
    expect(parsed.eip681Uri).toContain("84532");
    expect(parsed.qrData).toBeDefined();

    await client.close();
    await server.close();
  });
});

// ============================================================
// Task 4.4: transfer_tokens
// ============================================================

const mockProof = JSON.stringify({
  proof: {
    a: ["1", "2"],
    b: [
      ["3", "4"],
      ["5", "6"],
    ],
    c: ["7", "8"],
  },
  publicSignals: ["12345"],
});

describe("transfer_tokens tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should transfer ETH successfully", async () => {
    // Wallet deployed
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x1234");
    // 1 ETH balance
    vi.mocked(viemClient.getBalance).mockResolvedValue(1000000000000000000n);
    // readContract: voiceCommitment, nonce from EntryPoint
    vi.mocked(viemClient.readContract)
      .mockResolvedValueOnce(
        "0x0000000000000000000000000000000000000000000000000000000000003039",
      )
      .mockResolvedValueOnce(0n);
    // Relayer sends tx
    const mockTxHash =
      "0xaaaa000000000000000000000000000000000000000000000000000000000001";
    vi.mocked(relayerClientMock.writeContract).mockResolvedValue(
      mockTxHash as `0x${string}`,
    );
    // Receipt
    vi.mocked(viemClient.waitForTransactionReceipt).mockResolvedValue({
      status: "success",
      transactionHash: mockTxHash,
    } as any);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "transfer_tokens",
      arguments: {
        from: "0x1234567890123456789012345678901234567890",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amount: "0.1",
        token: "ETH",
        proof: mockProof,
      },
    });

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.txHash).toBe(mockTxHash);
    expect(parsed.status).toBe("confirmed");

    await client.close();
    await server.close();
  });

  it("should transfer USDC successfully", async () => {
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x1234");
    // readContract: USDC balanceOf, voiceCommitment, nonce
    vi.mocked(viemClient.readContract)
      .mockResolvedValueOnce(100000000n) // 100 USDC
      .mockResolvedValueOnce(
        "0x0000000000000000000000000000000000000000000000000000000000003039",
      ) // voiceCommitment = 12345
      .mockResolvedValueOnce(0n); // nonce
    const mockTxHash =
      "0xbbbb000000000000000000000000000000000000000000000000000000000002";
    vi.mocked(relayerClientMock.writeContract).mockResolvedValue(
      mockTxHash as `0x${string}`,
    );
    vi.mocked(viemClient.waitForTransactionReceipt).mockResolvedValue({
      status: "success",
      transactionHash: mockTxHash,
    } as any);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "transfer_tokens",
      arguments: {
        from: "0x1234567890123456789012345678901234567890",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amount: "10",
        token: "USDC",
        proof: mockProof,
      },
    });

    expect(result.isError).toBeFalsy();
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    const parsed = JSON.parse(textContent[0].text);
    expect(parsed.txHash).toBe(mockTxHash);
    expect(parsed.status).toBe("confirmed");

    await client.close();
    await server.close();
  });

  it("should return error on insufficient ETH balance", async () => {
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x1234");
    vi.mocked(viemClient.getBalance).mockResolvedValue(0n); // 0 ETH

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "transfer_tokens",
      arguments: {
        from: "0x1234567890123456789012345678901234567890",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amount: "0.1",
        token: "ETH",
        proof: mockProof,
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(textContent[0].text).toContain("残高不足");

    await client.close();
    await server.close();
  });

  it("should return error on insufficient USDC balance", async () => {
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x1234");
    vi.mocked(viemClient.readContract).mockResolvedValue(0n); // 0 USDC

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "transfer_tokens",
      arguments: {
        from: "0x1234567890123456789012345678901234567890",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amount: "10",
        token: "USDC",
        proof: mockProof,
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(textContent[0].text).toContain("残高不足");

    await client.close();
    await server.close();
  });

  it("should return error when wallet is not deployed", async () => {
    vi.mocked(viemClient.getBytecode).mockResolvedValue(undefined);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "transfer_tokens",
      arguments: {
        from: "0x1234567890123456789012345678901234567890",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amount: "0.1",
        token: "ETH",
        proof: mockProof,
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(textContent[0].text).toContain("未作成");

    await client.close();
    await server.close();
  });

  it("should return error on transaction failure", async () => {
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x1234");
    vi.mocked(viemClient.getBalance).mockResolvedValue(1000000000000000000n);
    vi.mocked(viemClient.readContract)
      .mockResolvedValueOnce(
        "0x0000000000000000000000000000000000000000000000000000000000003039",
      )
      .mockResolvedValueOnce(0n);
    vi.mocked(relayerClientMock.writeContract).mockRejectedValue(
      new Error("Transaction reverted"),
    );

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "transfer_tokens",
      arguments: {
        from: "0x1234567890123456789012345678901234567890",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amount: "0.1",
        token: "ETH",
        proof: mockProof,
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(textContent[0].text).toContain("Transaction reverted");

    await client.close();
    await server.close();
  });

  it("should decode FailedOpWithRevert inner wallet error", async () => {
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x1234");
    vi.mocked(viemClient.getBalance).mockResolvedValue(1000000000000000000n);
    vi.mocked(viemClient.readContract)
      .mockResolvedValueOnce(
        "0x0000000000000000000000000000000000000000000000000000000000003039",
      )
      .mockResolvedValueOnce(0n);

    const inner = encodeErrorResult({
      abi: [{ type: "error", name: "InvalidPublicSignal", inputs: [] }],
      errorName: "InvalidPublicSignal",
    });

    const outer = encodeErrorResult({
      abi: [
        {
          type: "error",
          name: "FailedOpWithRevert",
          inputs: [
            { type: "uint256", name: "opIndex" },
            { type: "string", name: "reason" },
            { type: "bytes", name: "inner" },
          ],
        },
      ],
      errorName: "FailedOpWithRevert",
      args: [0n, "AA23 reverted", inner],
    });

    const revertError = Object.assign(new Error("handleOps reverted"), {
      data: outer,
    });
    vi.mocked(relayerClientMock.writeContract).mockRejectedValue(revertError);

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "transfer_tokens",
      arguments: {
        from: "0x1234567890123456789012345678901234567890",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amount: "0.1",
        token: "ETH",
        proof: mockProof,
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(textContent[0].text).toContain("FailedOpWithRevert");
    expect(textContent[0].text).toContain("InvalidPublicSignal");

    await client.close();
    await server.close();
  });

  it("should return clear error on commitment mismatch before handleOps", async () => {
    vi.mocked(viemClient.getBytecode).mockResolvedValue("0x1234");
    vi.mocked(viemClient.getBalance).mockResolvedValue(1000000000000000000n);
    vi.mocked(viemClient.readContract).mockResolvedValueOnce(
      "0x0000000000000000000000000000000000000000000000000000000000000001",
    );

    const { server, client } = await createTestClient();
    const result = await client.callTool({
      name: "transfer_tokens",
      arguments: {
        from: "0x1234567890123456789012345678901234567890",
        to: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
        amount: "0.1",
        token: "ETH",
        proof: mockProof,
      },
    });

    expect(result.isError).toBe(true);
    const textContent = result.content as Array<{
      type: string;
      text: string;
    }>;
    expect(textContent[0].text).toContain("voiceCommitment");
    expect(relayerClientMock.writeContract).not.toHaveBeenCalled();

    await client.close();
    await server.close();
  });
});
