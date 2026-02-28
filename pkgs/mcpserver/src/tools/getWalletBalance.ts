import { formatEther, formatUnits } from "viem";
import { viemClient } from "../lib/viemClient.js";
import { USDC_ADDRESS, erc20Abi } from "../lib/contracts.js";

/**
 * get_wallet_balance ツールハンドラー
 *
 * 1. getBytecode でウォレットのデプロイ状態を確認
 * 2. getBalance で ETH 残高取得
 * 3. readContract で USDC (ERC-20) 残高取得
 */
export async function handleGetWalletBalance({
  walletAddress,
}: {
  walletAddress: string;
}) {
  try {
    const address = walletAddress as `0x${string}`;

    // デプロイ状態確認
    const bytecode = await viemClient.getBytecode({ address });
    const walletDeployed = bytecode != null && bytecode !== "0x";

    if (!walletDeployed) {
      // ETH 残高だけは取得可能（CREATE2 アドレスへの送金は可能）
      const ethBalance = await viemClient.getBalance({ address });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              walletDeployed: false,
              message:
                "ウォレットは未作成です。先に generate_zk_wallet でウォレットを作成してください。",
              eth: `${formatEther(ethBalance)} ETH`,
            }),
          },
        ],
      };
    }

    // ETH 残高
    const ethBalance = await viemClient.getBalance({ address });

    // USDC 残高 (6 decimals)
    const usdcBalance = (await viemClient.readContract({
      address: USDC_ADDRESS,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address],
    })) as bigint;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            walletDeployed: true,
            eth: `${formatEther(ethBalance)} ETH`,
            usdc: `${formatUnits(usdcBalance, 6)} USDC`,
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
