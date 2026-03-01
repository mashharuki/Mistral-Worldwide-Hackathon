import { Lock } from "lucide-react";

type ProcessingStateScreenProps = {
  amount: string;
  token: string;
  to: string;
  progress: number;
};

export const ProcessingStateScreen = ({
  amount,
  token,
  to,
  progress,
}: ProcessingStateScreenProps) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <section className="screen screen-processing">
      <div className="screen-bg-mesh" />
      <header className="screen-header">
        <h1 className="screen-title text-primary-subtle">VOICE ZK WALLET</h1>
      </header>

      <div className="processing-orb-container">
        <div className="processing-wave wave-1" />
        <div className="processing-wave wave-2" />
        <div className="processing-glow" />
        <div className="processing-core">
          <Lock size={34} />
        </div>
      </div>

      <p className="processing-status">VERIFYING VOICE IDENTITY...</p>

      <section className="processing-card">
        <p className="processing-title">
          SENDING {amount} {token}
        </p>
        <p className="processing-target">to {to}</p>
        <div className="processing-progress-bg">
          <div
            className="processing-progress-fill"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </section>
    </section>
  );
};
