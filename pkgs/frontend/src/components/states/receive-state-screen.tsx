import { ChevronLeft, Copy, Share2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "../ui/button";

type ReceiveStateScreenProps = {
  walletAddress: string;
  eip681Uri: string;
  displayAddress: string;
  onBack: () => void;
  onClose: () => void;
  onCopy: () => void;
  onShare: () => void;
};

export const ReceiveStateScreen = ({
  walletAddress,
  eip681Uri,
  displayAddress,
  onBack,
  onClose,
  onCopy,
  onShare,
}: ReceiveStateScreenProps) => {
  return (
    <section className="screen screen-receive">
      <div className="screen-bg-mesh" />
      <header className="screen-header receive-header">
        <Button variant="ghost" className="icon-only" onClick={onBack}>
          <ChevronLeft size={20} />
        </Button>
        <h1 className="screen-title receive-title">RECEIVE ASSETS</h1>
        <Button variant="ghost" className="icon-only" onClick={onClose}>
          <X size={20} />
        </Button>
      </header>

      <section className="qr-container">
        <div className="qr-code-box" data-testid="wallet-qrcode-state">
          <QRCodeSVG value={eip681Uri} size={220} marginSize={0} />
        </div>
        <p className="qr-label">Scan to send tokens</p>
      </section>

      <section className="receive-address-card">
        <span>{displayAddress || walletAddress}</span>
        <Button variant="ghost" className="icon-only" onClick={onCopy}>
          <Copy size={18} />
        </Button>
      </section>

      <Button className="share-address-button" onClick={onShare}>
        SHARE ADDRESS <Share2 size={16} />
      </Button>
    </section>
  );
};
