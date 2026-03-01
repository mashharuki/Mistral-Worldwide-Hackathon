import {
  decodeErrorResult,
  encodeFunctionData,
  encodeAbiParameters,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
  type Abi,
  type Hex,
} from "viem";
import { viemClient } from "../lib/viemClient.js";
import { relayerClient } from "../lib/relayerClient.js";
import {
  ENTRYPOINT_ADDRESS,
  USDC_ADDRESS,
  erc20Abi,
  entryPointAbi,
  voiceWalletAbi,
} from "../lib/contracts.js";

/**
 * uint128 x2 を bytes32 にパッキング
 */
function packUint128s(high: bigint, low: bigint): `0x${string}` {
  return `0x${high.toString(16).padStart(32, "0")}${low.toString(16).padStart(32, "0")}` as `0x${string}`;
}

const entryPointErrorAbi = [
  {
    type: "error",
    name: "FailedOp",
    inputs: [
      { type: "uint256", name: "opIndex" },
      { type: "string", name: "reason" },
    ],
  },
  {
    type: "error",
    name: "FailedOpWithRevert",
    inputs: [
      { type: "uint256", name: "opIndex" },
      { type: "string", name: "reason" },
      { type: "bytes", name: "inner" },
    ],
  },
] as const satisfies Abi;

const voiceWalletErrorAbi = [
  { type: "error", name: "InvalidVerifier", inputs: [] },
  { type: "error", name: "InvalidEntryPoint", inputs: [] },
  { type: "error", name: "InvalidProof", inputs: [] },
  { type: "error", name: "InvalidPublicSignal", inputs: [] },
  { type: "error", name: "ERC20TransferFailed", inputs: [] },
] as const satisfies Abi;

function isHexString(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]*$/.test(value);
}

function collectHexStrings(value: unknown): Hex[] {
  const results: Hex[] = [];
  const visited = new WeakSet<object>();

  const walk = (v: unknown) => {
    if (isHexString(v)) {
      results.push(v);
      return;
    }
    if (!v || typeof v !== "object") return;
    if (visited.has(v)) return;
    visited.add(v);

    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    for (const child of Object.values(v)) walk(child);
  };

  walk(value);
  return Array.from(new Set(results));
}

function decodeTransferFailure(error: unknown): string | null {
  const hexCandidates = collectHexStrings(error);

  for (const data of hexCandidates) {
    try {
      const decoded = decodeErrorResult({
        abi: entryPointErrorAbi,
        data,
      });

      if (decoded.errorName === "FailedOp") {
        const [opIndex, reason] = decoded.args as [bigint, string];
        return `EntryPoint FailedOp(opIndex=${opIndex.toString()}): ${reason}`;
      }

      if (decoded.errorName === "FailedOpWithRevert") {
        const [opIndex, reason, inner] = decoded.args as [bigint, string, Hex];
        let detail = `EntryPoint FailedOpWithRevert(opIndex=${opIndex.toString()}): ${reason}`;

        if (isHexString(inner) && inner !== "0x") {
          try {
            const innerDecoded = decodeErrorResult({
              abi: voiceWalletErrorAbi,
              data: inner,
            });
            detail += ` | inner=${innerDecoded.errorName}`;
          } catch {
            detail += ` | inner=${inner}`;
          }
        }

        return detail;
      }
    } catch {
      // continue
    }
  }

  return null;
}

function normalizeGroth16Proof(proofObj: any): {
  a: [string, string];
  b: [[string, string], [string, string]];
  c: [string, string];
} {
  // Already normalized shape
  if (proofObj?.a && proofObj?.b && proofObj?.c) {
    return {
      a: proofObj.a as [string, string],
      b: proofObj.b as [[string, string], [string, string]],
      c: proofObj.c as [string, string],
    };
  }

  // snarkjs output shape: pi_a / pi_b / pi_c
  if (proofObj?.pi_a && proofObj?.pi_b && proofObj?.pi_c) {
    return {
      a: [proofObj.pi_a[0], proofObj.pi_a[1]],
      // snarkjs -> solidity verifier argument conversion
      b: [
        [proofObj.pi_b[0][1], proofObj.pi_b[0][0]],
        [proofObj.pi_b[1][1], proofObj.pi_b[1][0]],
      ],
      c: [proofObj.pi_c[0], proofObj.pi_c[1]],
    };
  }

  throw new Error("invalid proof format: expected {a,b,c} or {pi_a,pi_b,pi_c}");
}

/**
 * transfer_tokens ツールハンドラー
 *
 * 1. ウォレットのデプロイ状態確認
 * 2. 残高チェック
 * 3. UserOperation を構築して EntryPoint.handleOps で送信
 * 4. トランザクション結果を返却
 */
export async function handleTransferTokens({
  from,
  to,
  amount,
  token,
  proof,
}: {
  from: string;
  to: string;
  amount: string;
  token: "ETH" | "USDC";
  proof: string;
}) {
  try {
    const walletAddress = from as `0x${string}`;
    const toAddress = to as `0x${string}`;

    // 1. ウォレットのデプロイ確認
    const bytecode = await viemClient.getBytecode({ address: walletAddress });
    if (!bytecode || bytecode === "0x") {
      return {
        content: [
          {
            type: "text" as const,
            text: "ウォレットが未作成です。先に generate_zk_wallet でウォレットを作成してください。",
          },
        ],
        isError: true,
      };
    }

    // 2. 残高チェック
    if (token === "ETH") {
      const balance = await viemClient.getBalance({ address: walletAddress });
      const amountWei = parseEther(amount);
      if (balance < amountWei) {
        return {
          content: [
            {
              type: "text" as const,
              text: `残高不足: 現在の残高は ${formatEther(balance)} ETH です。${amount} ETH の送金には残高が足りません。`,
            },
          ],
          isError: true,
        };
      }
    } else {
      // USDC balance check
      const balance = (await viemClient.readContract({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [walletAddress],
      })) as bigint;
      const amountUnits = parseUnits(amount, 6);
      if (balance < amountUnits) {
        return {
          content: [
            {
              type: "text" as const,
              text: `残高不足: 現在の残高は ${formatUnits(balance, 6)} USDC です。${amount} USDC の送金には残高が足りません。`,
            },
          ],
          isError: true,
        };
      }
    }

    // 3. callData を構築
    let callData: `0x${string}`;
    if (token === "ETH") {
      // VoiceWallet.execute(to, value, "0x")
      callData = encodeFunctionData({
        abi: voiceWalletAbi,
        functionName: "execute",
        args: [toAddress, parseEther(amount), "0x"],
      });
    } else {
      // VoiceWallet.execute(USDC_ADDRESS, 0, encode(transfer(to, amount)))
      const transferData = encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: [toAddress, parseUnits(amount, 6)],
      });
      callData = encodeFunctionData({
        abi: voiceWalletAbi,
        functionName: "execute",
        args: [USDC_ADDRESS, 0n, transferData],
      });
    }

    // 4. Proof をパース・ABI エンコードして signature を構築
    const proofData = JSON.parse(proof);
    const proofObj = proofData.proof ?? proofData;
    const publicSignals = proofData.publicSignals ?? proofData.input ?? ["0"];

    const normalizedProof = normalizeGroth16Proof(proofObj);
    const publicSignal = BigInt(publicSignals[0]);

    // 4.1 Wallet が保持する commitment と proof の public signal が一致しているか事前検証
    const walletCommitment = (await viemClient.readContract({
      address: walletAddress,
      abi: voiceWalletAbi,
      functionName: "voiceCommitment",
      args: [],
    })) as `0x${string}`;
    const walletCommitmentBigInt = BigInt(walletCommitment);

    if (walletCommitmentBigInt !== publicSignal) {
      return {
        content: [
          {
            type: "text" as const,
            text: `proof の publicSignals[0] がウォレットの voiceCommitment と一致しません。wallet=${walletCommitmentBigInt.toString()} proof=${publicSignal.toString()}`,
          },
        ],
        isError: true,
      };
    }

    const signature = encodeAbiParameters(
      [
        { type: "uint256[2]", name: "a" },
        { type: "uint256[2][2]", name: "b" },
        { type: "uint256[2]", name: "c" },
        { type: "uint256[1]", name: "input" },
      ],
      [
        normalizedProof.a.map(BigInt) as [bigint, bigint],
        normalizedProof.b.map((row: string[]) => row.map(BigInt)) as [
          [bigint, bigint],
          [bigint, bigint],
        ],
        normalizedProof.c.map(BigInt) as [bigint, bigint],
        [publicSignal] as [bigint],
      ],
    );

    // 5. Nonce を取得
    const nonce = (await viemClient.readContract({
      address: ENTRYPOINT_ADDRESS,
      abi: entryPointAbi,
      functionName: "getNonce",
      args: [walletAddress, 0n],
    })) as bigint;

    // 6. PackedUserOperation を構築 (ZK 検証を考慮して安全側に設定)
    const verificationGasLimit = 2000000n;
    const callGasLimit = 700000n;
    const preVerificationGas = 150000n;
    const maxPriorityFeePerGas = 1000000000n; // 1 gwei
    const maxFeePerGas = 2000000000n; // 2 gwei

    const userOp = {
      sender: walletAddress,
      nonce,
      initCode: "0x" as `0x${string}`,
      callData,
      accountGasLimits: packUint128s(verificationGasLimit, callGasLimit),
      preVerificationGas,
      gasFees: packUint128s(maxPriorityFeePerGas, maxFeePerGas),
      paymasterAndData: "0x" as `0x${string}`,
      signature,
    };

    // 7. Relayer 経由で EntryPoint.handleOps を呼び出し
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

    const txHash = await relayerClient.writeContract({
      address: ENTRYPOINT_ADDRESS,
      abi: entryPointAbi,
      functionName: "handleOps",
      args: [[userOp], relayerClient.account.address],
    });

    // 8. Receipt を待機
    const receipt = await viemClient.waitForTransactionReceipt({
      hash: txHash,
    });

    const status = receipt.status === "success" ? "confirmed" : "failed";

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            txHash,
            status,
            from: walletAddress,
            to: toAddress,
            amount,
            token,
          }),
        },
      ],
    };
  } catch (error) {
    const decoded = decodeTransferFailure(error);
    const message =
      decoded ?? (error instanceof Error ? error.message : "Unknown error");
    return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
    };
  }
}
