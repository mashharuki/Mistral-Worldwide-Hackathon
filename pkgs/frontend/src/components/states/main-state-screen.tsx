import { AudioLines, Copy, Mic, QrCode } from "lucide-react";
import { Button } from "../ui/button";
import { VoiceOrb } from "../voice-orb";
import type { VoiceActivityState, VoiceConnectionState } from "@/utils/types";

type MainStateScreenProps = {
  enrollmentPhrase: string;
  totalBalance: string;
  displayAddress: string;
  transcript: string;
  connectionState: VoiceConnectionState;
  activityState: VoiceActivityState;
  micLevel: number;
  onTapSpeak: () => void;
  onOpenReceive: () => void;
  onCopyAddress: () => void;
};

export const MainStateScreen = ({
  enrollmentPhrase,
  totalBalance,
  displayAddress,
  transcript,
  connectionState,
  activityState,
  micLevel,
  onTapSpeak,
  onOpenReceive,
  onCopyAddress,
}: MainStateScreenProps) => {
  return (
    <section className="screen screen-main">
      <div className="screen-bg-mesh" />
      <header className="screen-header">
        <h1 className="screen-title">VOICE ZK WALLET</h1>
        <div className="screen-status-icon">
          <Mic size={14} />
        </div>
      </header>

      <div className="orb-container">
        <button
          type="button"
          className="orb-hit-area"
          onClick={onTapSpeak}
          aria-label="tap to speak"
        >
          <VoiceOrb
            connectionState={connectionState}
            activityState={activityState}
            micLevel={micLevel}
          />
        </button>
        <p className="tap-hint">Tap to Speak</p>
      </div>

      <section className="phrase-card-main" aria-label="registration phrase">
        <p className="phrase-card-label">REGISTRATION PHRASE</p>
        <p className="phrase-card-text">{enrollmentPhrase}</p>
      </section>

      <section className="wallet-card-main">
        <p className="wallet-card-label">TOTAL BALANCE</p>
        <p className="wallet-card-balance">{totalBalance}</p>
        <div className="wallet-card-address-row">
          <span>{displayAddress}</span>
          <Button
            variant="ghost"
            className="icon-only"
            onClick={onCopyAddress}
            aria-label="copy address"
          >
            <Copy size={16} />
          </Button>
        </div>
      </section>

      <section className="actions-main">
        <Button className="action-send" onClick={onTapSpeak}>
          SEND
        </Button>
        <Button
          variant="secondary"
          className="action-qr"
          onClick={onOpenReceive}
          aria-label="open receive"
        >
          <QrCode size={18} />
        </Button>
      </section>

      <section className="transcript-main">
        <AudioLines size={16} />
        <span>{transcript}</span>
      </section>

      <footer className="credits-main">
        <span>POWERED BY MISTRAL AI</span>
        <span className="divider" />
        <span>VOICE BY ELEVENLABS</span>
      </footer>
    </section>
  );
};
