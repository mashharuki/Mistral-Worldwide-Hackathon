import { viemClient } from "../lib/viemClient.js";

/**
 * show_wallet_qrcode ツールハンドラー
 *
 * EIP-681 ペイメントリンク URI を生成し、QR コードデータとして返却する。
 * フォーマット: ethereum:<address>@<chainId>
 */
export async function handleShowWalletQrcode({
  walletAddress,
}: {
  walletAddress: string;
}) {
  try {
    const chainId = viemClient.chain?.id ?? 84532;
    const eip681Uri = `ethereum:${walletAddress}@${chainId}`;

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            eip681Uri,
            qrData: eip681Uri,
            walletAddress,
            chainId,
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
