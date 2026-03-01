import { describe, it, expect } from "vitest";
import { app, createMcpServer } from "../app.js";
import { backendClient } from "../lib/backendClient.js";
import { viemClient } from "../lib/viemClient.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

/**
 * SSE レスポンスから JSON-RPC の data 行をパースする
 */
async function parseSseJsonRpc(res: Response): Promise<unknown> {
  const text = await res.text();
  const lines = text.split("\n");
  for (const line of lines) {
    if (line.startsWith("data: ")) {
      return JSON.parse(line.slice(6));
    }
  }
  return JSON.parse(text);
}

const MCP_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json, text/event-stream",
};

describe("MCP Server Setup", () => {
  describe("Hono app", () => {
    it("GET / should return health status", async () => {
      const res = await app.request("/");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ status: "ok" });
    });

    it("GET /health should return health status", async () => {
      const res = await app.request("/health");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ status: "ok" });
    });

    it("POST /mcp should accept MCP initialize request", async () => {
      const res = await app.request("/mcp", {
        method: "POST",
        headers: MCP_HEADERS,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2025-03-26",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
        }),
      });
      expect(res.status).toBe(200);
      const body = (await parseSseJsonRpc(res)) as {
        result: { serverInfo: { name: string; version: string } };
      };
      expect(body.result).toBeDefined();
      expect(body.result.serverInfo.name).toBe("voice-zk-wallet-mcp");
      expect(body.result.serverInfo.version).toBe("0.1.0");
    });
  });

  describe("McpServer tool registration", () => {
    it("should register all 8 MCP tools via in-memory transport", async () => {
      const server = createMcpServer();
      const client = new Client({
        name: "test-client",
        version: "1.0.0",
      });

      const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      const { tools } = await client.listTools();
      const toolNames = tools.map((t) => t.name);

      expect(toolNames).toContain("extract_voice_features");
      expect(toolNames).toContain("generate_zk_wallet");
      expect(toolNames).toContain("create_wallet");
      expect(toolNames).toContain("generate_zk_proof");
      expect(toolNames).toContain("get_wallet_balance");
      expect(toolNames).toContain("get_wallet_address");
      expect(toolNames).toContain("show_wallet_qrcode");
      expect(toolNames).toContain("transfer_tokens");
      expect(toolNames).toHaveLength(8);

      await client.close();
      await server.close();
    });

    it("each tool should have an input schema", async () => {
      const server = createMcpServer();
      const client = new Client({
        name: "test-client",
        version: "1.0.0",
      });

      const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair();
      await Promise.all([
        server.connect(serverTransport),
        client.connect(clientTransport),
      ]);

      const { tools } = await client.listTools();
      for (const tool of tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
      }

      await client.close();
      await server.close();
    });
  });

  describe("createMcpServer", () => {
    it("should create a valid McpServer instance", () => {
      const server = createMcpServer();
      expect(server).toBeDefined();
      expect(typeof server.connect).toBe("function");
      expect(typeof server.close).toBe("function");
      expect(typeof server.registerTool).toBe("function");
    });
  });

  describe("viem client", () => {
    it("should be configured for Base Sepolia", () => {
      expect(viemClient).toBeDefined();
      expect(viemClient.chain?.id).toBe(84532);
      expect(viemClient.chain?.name).toBe("Base Sepolia");
    });
  });

  describe("backend client", () => {
    it("should have the configured base URL", () => {
      expect(backendClient).toBeDefined();
      expect(backendClient.baseUrl).toBeDefined();
      expect(typeof backendClient.baseUrl).toBe("string");
    });

    it("should have extractFeatures method", () => {
      expect(typeof backendClient.extractFeatures).toBe("function");
    });

    it("should have generateProof method", () => {
      expect(typeof backendClient.generateProof).toBe("function");
    });

    it("should have generateCommitment method", () => {
      expect(typeof backendClient.generateCommitment).toBe("function");
    });

    it("should have health method", () => {
      expect(typeof backendClient.health).toBe("function");
    });
  });
});
