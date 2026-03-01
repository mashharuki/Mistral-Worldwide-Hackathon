import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type WalletCardProps = {
  walletAddress: string;
  ethBalance: string;
  usdcBalance: string;
};

export const WalletCard = ({
  walletAddress,
  ethBalance,
  usdcBalance,
}: WalletCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card data-testid="wallet-card">
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/70 p-3">
              <p className="text-xs text-(--ink-subtle)">ETH</p>
              <p className="text-sm font-semibold">{ethBalance}</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3">
              <p className="text-xs text-(--ink-subtle)">USDC</p>
              <p className="text-sm font-semibold">{usdcBalance}</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/70 bg-[color-mix(in_srgb,var(--surface-muted)_72%,white)] p-3">
            <p className="text-xs text-(--ink-subtle)">Address</p>
            <p className="break-all font-mono text-xs text-(--ink-primary)">
              {walletAddress}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
