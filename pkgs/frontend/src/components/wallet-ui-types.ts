export type ToolResultType =
  | "balance"
  | "address"
  | "qrcode"
  | "transaction"
  | "error";

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

export type TxStatus =
  | "confirming"
  | "submitting"
  | "pending"
  | "confirmed"
  | "failed";
