import { useConversation } from "@elevenlabs/react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { MainStateScreen } from "./components/states/main-state-screen";
import { ProcessingStateScreen } from "./components/states/processing-state-screen";
import { ReceiveStateScreen } from "./components/states/receive-state-screen";
import { SuccessStateScreen } from "./components/states/success-state-screen";
import "./css/App.css";
import { PAGE_STAGGER } from "./lib/theme";
import {
  DEFAULT_CONNECTION_TYPE,
  DEFAULT_VOLUME_RATE,
} from "./utils/constants";
import {
  asString,
  buildActivityState,
  buildConnectionState,
  buildErrorText,
  buildLogMessage,
} from "./utils/helpers";
import { type LogMessage, type TxStatus } from "./utils/types";

type ViewMode = "auto" | "main" | "receive";

function App() {
  const agentIdFromEnv =
    typeof import.meta.env.VITE_ELEVENLABS_AGENT_ID === "string"
      ? import.meta.env.VITE_ELEVENLABS_AGENT_ID
      : "";

  const [micReady, setMicReady] = useState(false);
  const [micMuted] = useState(false);
  const [volumeRate] = useState(DEFAULT_VOLUME_RATE);
  const [statusText, setStatusText] = useState("disconnected");
  const [modeText, setModeText] = useState("idle");
  const [errorText, setErrorText] = useState("");
  const [messages, setMessages] = useState<LogMessage[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("auto");

  const conversation = useConversation({
    micMuted,
    volume: volumeRate,
    onMessage: (message: unknown) => {
      setMessages((prevMessages) => [...prevMessages, buildLogMessage(message)]);
    },
    onError: (error: unknown) => {
      setErrorText(buildErrorText(error));
    },
    onStatusChange: (payload: { status: string }) => {
      setStatusText(payload.status);
    },
    onModeChange: (payload: { mode: string }) => {
      setModeText(payload.mode);
    },
    onConnect: () => {
      setErrorText("");
    },
  });

  const isConnected = useMemo(() => statusText === "connected", [statusText]);
  const isSpeaking = useMemo(
    () => Boolean(conversation.isSpeaking),
    [conversation.isSpeaking],
  );

  const voiceConnectionState = useMemo(
    () => buildConnectionState(statusText),
    [statusText],
  );
  const voiceActivityState = useMemo(
    () => buildActivityState(modeText, isSpeaking),
    [isSpeaking, modeText],
  );

  const latestToolSnapshot = useMemo(() => {
    let walletAddress = "";
    let ethBalance = "0.00 ETH";
    let usdcBalance = "0 USDC";
    let eip681Uri = "";
    let txTo = "Alice (0x123...abc)";
    let txAmount = "1.5";
    let txToken = "ETH";
    let txStatus: TxStatus = "pending";
    let txHash = "0x3a4b...cdef";
    let hasTransaction = false;

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const toolResult = messages[index]?.toolResult;
      if (!toolResult) {
        continue;
      }

      if (
        !walletAddress &&
        (toolResult.type === "address" || toolResult.type === "balance")
      ) {
        walletAddress =
          asString(toolResult.data.walletAddress) ||
          asString(toolResult.data.address) ||
          walletAddress;
      }
      if (toolResult.type === "balance") {
        ethBalance = asString(toolResult.data.ethBalance) || ethBalance;
        usdcBalance = asString(toolResult.data.usdcBalance) || usdcBalance;
      }
      if (toolResult.type === "qrcode" && !eip681Uri) {
        eip681Uri = asString(toolResult.data.eip681Uri);
      }
      if (toolResult.type === "transaction") {
        hasTransaction = true;
        txTo = asString(toolResult.data.to) || txTo;
        txAmount = asString(toolResult.data.amount) || txAmount;
        txToken = asString(toolResult.data.token) === "USDC" ? "USDC" : "ETH";
        txStatus =
          asString(toolResult.data.status) === "confirming" ||
          asString(toolResult.data.status) === "submitting" ||
          asString(toolResult.data.status) === "pending" ||
          asString(toolResult.data.status) === "confirmed" ||
          asString(toolResult.data.status) === "failed"
            ? (asString(toolResult.data.status) as TxStatus)
            : txStatus;
        txHash = asString(toolResult.data.txHash) || txHash;
      }
    }

    return {
      walletAddress,
      ethBalance,
      usdcBalance,
      eip681Uri,
      txTo,
      txAmount,
      txToken,
      txStatus,
      txHash,
      hasTransaction,
    };
  }, [messages]);

  const hasProcessingTx =
    latestToolSnapshot.hasTransaction &&
    (latestToolSnapshot.txStatus === "confirming" ||
      latestToolSnapshot.txStatus === "submitting" ||
      latestToolSnapshot.txStatus === "pending");
  const hasSuccessTx =
    latestToolSnapshot.hasTransaction &&
    latestToolSnapshot.txStatus === "confirmed";

  const currentScreen = useMemo(() => {
    if (viewMode === "receive") {
      return "receive" as const;
    }
    if (viewMode === "main") {
      return "main" as const;
    }
    if (hasSuccessTx) {
      return "success" as const;
    }
    if (hasProcessingTx) {
      return "processing" as const;
    }
    return "main" as const;
  }, [hasProcessingTx, hasSuccessTx, viewMode]);

  const instructionText =
    latestToolSnapshot.txTo && latestToolSnapshot.txAmount
      ? `Say \"Send ${latestToolSnapshot.txAmount} ${latestToolSnapshot.txToken} to ${latestToolSnapshot.txTo}\"`
      : 'Say "Send 1.5 ETH to Alice"';

  const displayAddress = useMemo(() => {
    const rawAddress = latestToolSnapshot.walletAddress || "0x71C24f3D71C24f3D";
    if (rawAddress.length <= 14) {
      return rawAddress;
    }
    return `${rawAddress.slice(0, 6)}...${rawAddress.slice(-4)}`;
  }, [latestToolSnapshot.walletAddress]);

  const totalBalance = useMemo(() => {
    const ethValue = Number.parseFloat(latestToolSnapshot.ethBalance);
    const usdcValue = Number.parseFloat(latestToolSnapshot.usdcBalance);
    const safeEth = Number.isFinite(ethValue) ? ethValue : 0;
    const safeUsdc = Number.isFinite(usdcValue) ? usdcValue : 0;
    const roughUsd = safeUsdc + safeEth * 2600;
    return `$ ${roughUsd.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }, [latestToolSnapshot.ethBalance, latestToolSnapshot.usdcBalance]);

  const latestTranscript = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index].role === "user") {
        return messages[index].content;
      }
    }
    return "Listening...";
  }, [messages]);

  const txProgress = useMemo(() => {
    if (latestToolSnapshot.txStatus === "confirming") {
      return 35;
    }
    if (latestToolSnapshot.txStatus === "submitting") {
      return 72;
    }
    if (latestToolSnapshot.txStatus === "pending") {
      return 88;
    }
    return 100;
  }, [latestToolSnapshot.txStatus]);

  const handleStartSession = async (): Promise<void> => {
    setErrorText("");
    if (!agentIdFromEnv) {
      setErrorText("VITE_ELEVENLABS_AGENT_ID を設定してください");
      return;
    }

    try {
      if (!micReady) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicReady(true);
      }

      try {
        await conversation.startSession({
          agentId: agentIdFromEnv,
          connectionType: DEFAULT_CONNECTION_TYPE,
        });
      } catch (firstError: unknown) {
        console.warn("WebRTC接続に失敗。WebSocketへフォールバックします。", firstError);
        await conversation.startSession({
          agentId: agentIdFromEnv,
          connectionType: "websocket",
        });
      }
    } catch (error: unknown) {
      const rawMessage = buildErrorText(error);
      if (rawMessage.includes("WebSocket")) {
        setErrorText(
          "音声接続に失敗しました。ネットワーク・VPN・ファイアウォール設定と ElevenLabs Agent ID を確認してください。",
        );
        return;
      }
      setErrorText(rawMessage);
    }
  };

  const handleTapSpeak = async (): Promise<void> => {
    if (!isConnected) {
      await handleStartSession();
      return;
    }
    conversation.sendUserActivity();
  };

  const copyAddress = async (): Promise<void> => {
    if (!latestToolSnapshot.walletAddress) {
      return;
    }
    try {
      await navigator.clipboard.writeText(latestToolSnapshot.walletAddress);
    } catch {
      // no-op
    }
  };

  const shareAddress = async (): Promise<void> => {
    const url =
      latestToolSnapshot.eip681Uri ||
      `ethereum:${latestToolSnapshot.walletAddress || "0x71C24f3D71C24f3D"}`;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Voice ZK Wallet",
          text: latestToolSnapshot.walletAddress,
          url,
        });
        return;
      } catch {
        // no-op
      }
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // no-op
    }
  };

  return (
    <motion.div
      className="app"
      variants={PAGE_STAGGER.container}
      initial="hidden"
      animate="visible"
    >
      <motion.section className="phone-shell" variants={PAGE_STAGGER.item}>
        {currentScreen === "receive" ? (
          <ReceiveStateScreen
            walletAddress={latestToolSnapshot.walletAddress || "0x71C24f3D71C24f3D"}
            eip681Uri={
              latestToolSnapshot.eip681Uri ||
              `ethereum:${latestToolSnapshot.walletAddress || "0x71C24f3D71C24f3D"}`
            }
            displayAddress={displayAddress}
            onBack={() => setViewMode("main")}
            onClose={() => setViewMode("auto")}
            onCopy={copyAddress}
            onShare={shareAddress}
          />
        ) : null}

        {currentScreen === "processing" ? (
          <ProcessingStateScreen
            amount={latestToolSnapshot.txAmount}
            token={latestToolSnapshot.txToken}
            to={latestToolSnapshot.txTo}
            progress={txProgress}
          />
        ) : null}

        {currentScreen === "success" ? (
          <SuccessStateScreen
            amount={latestToolSnapshot.txAmount}
            token={latestToolSnapshot.txToken}
            to={latestToolSnapshot.txTo}
            txHash={latestToolSnapshot.txHash}
            explorerUrl={`https://sepolia.basescan.org/tx/${latestToolSnapshot.txHash}`}
            onBackHome={() => setViewMode("main")}
          />
        ) : null}

        {currentScreen === "main" ? (
          <MainStateScreen
            instruction={instructionText}
            totalBalance={totalBalance}
            displayAddress={displayAddress}
            transcript={latestTranscript}
            connectionState={voiceConnectionState}
            activityState={voiceActivityState}
            micLevel={isConnected && !micMuted ? volumeRate : 0}
            onTapSpeak={handleTapSpeak}
            onOpenReceive={() => setViewMode("receive")}
            onCopyAddress={copyAddress}
          />
        ) : null}

        {errorText ? <div className="floating-error">{errorText}</div> : null}
      </motion.section>
    </motion.div>
  );
}

export default App;
