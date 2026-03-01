import { motion } from "framer-motion";
import "../css/voice-orb.css";

export type VoiceConnectionState = "disconnected" | "connecting" | "connected";
export type VoiceActivityState = "idle" | "listening" | "speaking" | "thinking";

type VoiceOrbProps = {
  connectionState: VoiceConnectionState;
  activityState: VoiceActivityState;
  micLevel: number;
};

const clampVoiceLevel = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
};

const getPulseScale = (
  activityState: VoiceActivityState,
  voiceLevel: number,
): number => {
  if (activityState === "speaking") {
    return 1.12 + voiceLevel * 0.25;
  }
  if (activityState === "listening") {
    return 1.05 + voiceLevel * 0.15;
  }
  if (activityState === "thinking") {
    return 1.08;
  }
  return 1;
};

export function VoiceOrb({
  connectionState,
  activityState,
  micLevel,
}: VoiceOrbProps) {
  const voiceLevel = clampVoiceLevel(micLevel);
  const pulseScale = getPulseScale(activityState, voiceLevel);

  return (
    <div
      className={`voice-orb voice-orb--${connectionState} voice-orb--${activityState}`}
      data-testid="voice-orb"
      style={{ "--voice-level": String(voiceLevel) } as Record<string, string>}
    >
      <div className="voice-orb__waves" aria-hidden="true">
        <span className="voice-orb__wave" />
        <span className="voice-orb__wave" />
        <span className="voice-orb__wave" />
      </div>
      <motion.div
        className="voice-orb__core"
        animate={{
          scale: [1, pulseScale, 1],
          opacity: connectionState === "disconnected" ? [0.55, 0.65, 0.55] : [0.72, 1, 0.72],
        }}
        transition={{
          duration: activityState === "speaking" ? 0.45 : 1.2,
          ease: "easeInOut",
          repeat: Number.POSITIVE_INFINITY,
        }}
      >
        <div className="voice-orb__inner" />
      </motion.div>
      <div className="voice-orb__status" aria-live="polite">
        <span>{connectionState}</span>
        <span>{activityState}</span>
      </div>
    </div>
  );
}
