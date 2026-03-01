import { asString } from "@/utils/helpers";
import type { LogMessage, MessageLogProps } from "@/utils/types";
import { motion } from "framer-motion";
import { QRCodeCard } from "./qrcode-card";
import { TransactionCard } from "./transaction-card";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { WalletCard } from "./wallet-card";

const InlineToolResult = ({ message }: { message: LogMessage }) => {
  if (!message.toolResult) {
    return null;
  }

  const { type, data } = message.toolResult;
  if (type === "balance" || type === "address") {
    return (
      <WalletCard
        walletAddress={asString(data.walletAddress) || asString(data.address)}
        ethBalance={asString(data.ethBalance) || "-"}
        usdcBalance={asString(data.usdcBalance) || "-"}
      />
    );
  }

  if (type === "qrcode") {
    return (
      <QRCodeCard
        walletAddress={asString(data.walletAddress)}
        eip681Uri={asString(data.eip681Uri)}
      />
    );
  }

  if (type === "transaction") {
    return (
      <TransactionCard
        to={asString(data.to)}
        amount={asString(data.amount)}
        token={asString(data.token) === "USDC" ? "USDC" : "ETH"}
        status={
          asString(data.status) === "confirming" ||
          asString(data.status) === "submitting" ||
          asString(data.status) === "pending" ||
          asString(data.status) === "confirmed" ||
          asString(data.status) === "failed"
            ? (asString(data.status) as
                | "confirming"
                | "submitting"
                | "pending"
                | "confirmed"
                | "failed")
            : "pending"
        }
        txHash={asString(data.txHash)}
      />
    );
  }

  if (type === "error") {
    return (
      <div className="rounded-xl border border-[color-mix(in_srgb,var(--brand-primary)_40%,white)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,white)] px-3 py-2 text-sm text-(--ink-primary)">
        {asString(data.message) || "エラーが発生しました"}
      </div>
    );
  }

  return null;
};

export const MessageLog = ({ messages }: MessageLogProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Log</CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <p className="text-sm text-(--ink-subtle)">
            まだメッセージがありません。
          </p>
        ) : (
          <ul className="space-y-3">
            {messages.map((message) => (
              <motion.li
                key={message.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-white/70 bg-white/70 p-3"
              >
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono uppercase text-(--ink-subtle)">
                    {message.role}
                  </span>
                  <span className="text-(--ink-subtle)">
                    {new Date(message.timestamp).toLocaleTimeString("ja-JP")}
                  </span>
                </div>
                <p className="mb-2 text-sm text-(--ink-primary)">
                  {message.content}
                </p>
                <InlineToolResult message={message} />
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
