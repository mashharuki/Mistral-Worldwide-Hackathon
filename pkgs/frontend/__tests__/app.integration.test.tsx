// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../src/App";

type ConversationOptions = {
  onMessage?: (message: unknown) => void;
};

const mockConversation = {
  canSendFeedback: false,
  isSpeaking: false,
  startSession: vi.fn(async () => "conv_test"),
  endSession: vi.fn(async () => undefined),
  sendUserMessage: vi.fn(),
  sendUserActivity: vi.fn(),
  sendFeedback: vi.fn(),
};

let capturedOptions: ConversationOptions | undefined;

vi.mock("@elevenlabs/react", () => ({
  useConversation: (options: ConversationOptions) => {
    capturedOptions = options;
    return mockConversation;
  },
}));

afterEach(() => {
  cleanup();
  capturedOptions = undefined;
});

describe("App integration", () => {
  it("reflects balance tool result in main screen balance and address", () => {
    render(<App />);

    act(() => {
      capturedOptions?.onMessage?.({
        role: "agent",
        content: "こちらが残高です",
        type: "tool_result",
        toolName: "get_wallet_balance",
        result: {
          walletAddress: "0x1234567890123456789012345678901234567890",
          ethBalance: "0.5 ETH",
          usdcBalance: "100 USDC",
        },
      });
    });

    expect(screen.getByText("$ 1,400")).toBeInTheDocument();
    expect(screen.getByText("0x1234...7890")).toBeInTheDocument();
  });
});
