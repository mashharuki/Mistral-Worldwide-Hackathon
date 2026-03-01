// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MessageLog } from "./message-log";
import { QRCodeCard } from "./qrcode-card";
import { TransactionCard } from "./transaction-card";
import { WalletCard } from "./wallet-card";

afterEach(() => {
  cleanup();
});

describe("WalletCard", () => {
  it("shows ETH/USDC balances and wallet address", () => {
    render(
      <WalletCard
        walletAddress="0x1234567890123456789012345678901234567890"
        ethBalance="0.5 ETH"
        usdcBalance="100 USDC"
      />,
    );

    expect(screen.getByText("0.5 ETH")).toBeInTheDocument();
    expect(screen.getByText("100 USDC")).toBeInTheDocument();
    expect(
      screen.getByText("0x1234567890123456789012345678901234567890"),
    ).toBeInTheDocument();
  });
});

describe("QRCodeCard", () => {
  it("renders EIP-681 link and qr container", () => {
    render(
      <QRCodeCard
        walletAddress="0x1234567890123456789012345678901234567890"
        eip681Uri="ethereum:0x1234567890123456789012345678901234567890"
      />,
    );

    const link = screen.getByRole("link", { name: "EIP-681 Link" });
    expect(link).toHaveAttribute(
      "href",
      "ethereum:0x1234567890123456789012345678901234567890",
    );
    expect(screen.getByTestId("wallet-qrcode")).toBeInTheDocument();
  });
});

describe("TransactionCard", () => {
  it("shows realtime transaction status and hash", () => {
    render(
      <TransactionCard
        to="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
        amount="0.01"
        token="ETH"
        status="pending"
        txHash="0xhash"
      />,
    );

    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("0xhash")).toBeInTheDocument();
  });
});

describe("MessageLog", () => {
  it("shows conversation and inline tool result card", () => {
    render(
      <MessageLog
        messages={[
          {
            id: "m1",
            role: "user",
            content: "残高を教えて",
            timestamp: 1740000000000,
          },
          {
            id: "m2",
            role: "agent",
            content: "残高です",
            timestamp: 1740000001000,
            toolResult: {
              type: "balance",
              data: {
                walletAddress: "0x1234567890123456789012345678901234567890",
                ethBalance: "0.5 ETH",
                usdcBalance: "100 USDC",
              },
            },
          },
        ]}
      />,
    );

    expect(screen.getByText("残高を教えて")).toBeInTheDocument();
    expect(screen.getByText("残高です")).toBeInTheDocument();
    expect(screen.getByTestId("wallet-card")).toBeInTheDocument();
  });
});
