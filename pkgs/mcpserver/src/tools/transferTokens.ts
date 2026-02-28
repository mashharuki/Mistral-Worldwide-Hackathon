import {
  encodeFunctionData,
  encodeAbiParameters,
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
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

    const signature = encodeAbiParameters(
      [
        { type: "uint256[2]", name: "a" },
        { type: "uint256[2][2]", name: "b" },
        { type: "uint256[2]", name: "c" },
        { type: "uint256[1]", name: "input" },
      ],
      [
        proofObj.a.map(BigInt) as [bigint, bigint],
        proofObj.b.map((row: string[]) => row.map(BigInt)) as [
          [bigint, bigint],
          [bigint, bigint],
        ],
        proofObj.c.map(BigInt) as [bigint, bigint],
        [BigInt(publicSignals[0])] as [bigint],
      ],
    );

    // 5. Nonce を取得
    const nonce = (await viemClient.readContract({
      address: ENTRYPOINT_ADDRESS,
      abi: entryPointAbi,
      functionName: "getNonce",
      args: [walletAddress, 0n],
    })) as bigint;

    // 6. PackedUserOperation を構築 (ハッカソン用: ハードコード gas 値)
    const verificationGasLimit = 500000n;
    const callGasLimit = 500000n;
    const preVerificationGas = 100000n;
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{ type: "text" as const, text: message }],
      isError: true,
    };
  }
}
