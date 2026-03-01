import { Check, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";

type SuccessStateScreenProps = {
  amount: string;
  token: string;
  to: string;
  txHash: string;
  explorerUrl: string;
  onBackHome: () => void;
};

export const SuccessStateScreen = ({
  amount,
  token,
  to,
  txHash,
  explorerUrl,
  onBackHome,
}: SuccessStateScreenProps) => {
  return (
    <section className="screen screen-success">
      <div className="screen-bg-mesh" />
      <header className="screen-header">
        <h1 className="screen-title">VOICE ZK WALLET</h1>
      </header>

      <div className="success-orb-container">
        <div className="success-glow" />
        <div className="success-core">
          <Check size={38} />
        </div>
      </div>

      <p className="success-status">TRANSACTION SUCCESSFUL</p>
      <p className="success-description">
        {amount} {token} has been sent to {to}
      </p>

      <section className="success-card">
        <div className="success-hash-row">
          <span className="hash-label">TX HASH</span>
          <span className="hash-value">{txHash}</span>
        </div>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
          className="success-link"
        >
          VIEW ON EXPLORER <ExternalLink size={14} />
        </a>
      </section>

      <Button className="back-home-button" onClick={onBackHome}>
        BACK TO HOME
      </Button>
    </section>
  );
};
