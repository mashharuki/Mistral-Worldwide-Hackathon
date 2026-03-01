import type { QRCodeCardProps } from "@/utils/types";
import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export const QRCodeCard = ({ walletAddress, eip681Uri }: QRCodeCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Receive</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="inline-flex rounded-2xl bg-white p-3"
            data-testid="wallet-qrcode"
          >
            <QRCodeSVG value={eip681Uri} size={164} marginSize={1} />
          </div>
          <p className="break-all font-mono text-xs text-(--ink-subtle)">
            {walletAddress}
          </p>
          <a
            href={eip681Uri}
            className="text-sm font-semibold text-(--brand-secondary) underline underline-offset-2"
          >
            EIP-681 Link
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
};
