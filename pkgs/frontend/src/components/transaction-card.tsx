import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import type { TxStatus } from "./wallet-ui-types";

type TransactionCardProps = {
  to: string;
  amount: string;
  token: "ETH" | "USDC";
  status: TxStatus;
  txHash?: string;
};

export const TransactionCard = ({
  to,
  amount,
  token,
  status,
  txHash,
}: TransactionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Transaction</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="inline-flex rounded-full border border-white/70 bg-[color-mix(in_srgb,var(--brand-secondary)_16%,white)] px-3 py-1 text-xs font-bold uppercase tracking-wide">
            {status}
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-(--ink-subtle)">Amount:</span> {amount} {token}
            </p>
            <p className="break-all">
              <span className="text-(--ink-subtle)">To:</span> {to}
            </p>
            {txHash ? (
              <p className="break-all font-mono text-xs">
                <span className="text-(--ink-subtle)">Tx:</span> {txHash}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
