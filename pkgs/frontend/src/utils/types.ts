// Application-wide types and interfaces

// Voice orb types
export type VoiceConnectionState = "disconnected" | "connecting" | "connected";
export type VoiceActivityState = "idle" | "listening" | "speaking" | "thinking";

// Connection types
export type ConnectionType = "webrtc" | "websocket";

// Message types
export type MessageRole = "user" | "agent" | "debug" | "system";

export type MessageItem = {
  id: string;
  role: MessageRole;
  text: string;
  isFinal: boolean;
};

// Wallet UI types
export type ToolResultType = "balance" | "address" | "qrcode" | "transaction" | "error";

export type ToolResultCard = {
  type: ToolResultType;
  data: Record<string, unknown>;
};

export type LogMessage = {
  id: string;
  role: "user" | "agent" | "system";
  content: string;
  timestamp: number;
  toolResult?: ToolResultCard;
};

// Transaction types
export type TxStatus = "confirming" | "submitting" | "pending" | "confirmed" | "failed";

// Component props types
export type VoiceOrbProps = {
  connectionState: VoiceConnectionState;
  activityState: VoiceActivityState;
  micLevel: number;
};

export type WalletCardProps = {
  walletAddress: string;
  ethBalance: string;
  usdcBalance: string;
};

export type QRCodeCardProps = {
  walletAddress: string;
  eip681Uri: string;
};

export type TransactionCardProps = {
  to: string;
  amount: string;
  token: string;
  status: TxStatus;
  txHash: string;
};

export type MessageLogProps = {
  messages: LogMessage[];
};
