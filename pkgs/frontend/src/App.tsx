import { useConversation } from "@elevenlabs/react";
import { useMemo, useState } from "react";
import "./css/App.css";

type ConnectionType = "webrtc" | "websocket";
type MessageRole = "user" | "agent" | "debug" | "system";

type MessageItem = {
  id: string;
  role: MessageRole;
  text: string;
  isFinal: boolean;
};

const DEFAULT_VOLUME_RATE = 0.8;
const DEFAULT_CONNECTION_TYPE: ConnectionType = "webrtc";

const getRandomId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getStringValue = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

const getBooleanValue = (value: unknown): boolean => {
  return typeof value === "boolean" ? value : false;
};

const getMessageRole = (value: unknown): MessageRole => {
  const roleValue = getStringValue(value).toLowerCase();
  if (roleValue === "user" || roleValue === "agent" || roleValue === "debug") {
    return roleValue;
  }
  return "system";
};

const buildMessageItem = (message: unknown): MessageItem => {
  if (isRecord(message)) {
    const textValue =
      getStringValue(message.text) ||
      getStringValue(message.message) ||
      JSON.stringify(message);
    const roleText =
      getStringValue(message.role) ||
      getStringValue(message.type) ||
      getStringValue(message.source);
    const roleValue = getMessageRole(roleText);
    const isFinalValue =
      getBooleanValue(message.isFinal) || getBooleanValue(message.final);
    return {
      id: getRandomId(),
      role: roleValue,
      text: textValue,
      isFinal: isFinalValue,
    };
  }

  return {
    id: getRandomId(),
    role: "system",
    text: getStringValue(message) || String(message),
    isFinal: true,
  };
};

const buildErrorText = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return JSON.stringify(error);
};

function App() {
  const agentIdFromEnv =
    typeof import.meta.env.VITE_ELEVENLABS_AGENT_ID === "string"
      ? import.meta.env.VITE_ELEVENLABS_AGENT_ID
      : "";
  const [userId, setUserId] = useState("");
  const [connectionType, setConnectionType] = useState<ConnectionType>(
    DEFAULT_CONNECTION_TYPE,
  );
  const [micReady, setMicReady] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [volumeRate, setVolumeRate] = useState(DEFAULT_VOLUME_RATE);
  const [statusText, setStatusText] = useState("disconnected");
  const [modeText, setModeText] = useState("idle");
  const [errorText, setErrorText] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");

  const conversation = useConversation({
    micMuted,
    volume: volumeRate,
    onMessage: (message: unknown) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        buildMessageItem(message),
      ]);
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
    onDisconnect: () => {
      setConversationId("");
    },
  });

  const isConnected = useMemo(() => statusText === "connected", [statusText]);
  const canSendFeedback = useMemo(
    () => Boolean(conversation.canSendFeedback),
    [conversation.canSendFeedback],
  );
  const isSpeaking = useMemo(
    () => Boolean(conversation.isSpeaking),
    [conversation.isSpeaking],
  );

  const handleRequestMic = async (): Promise<void> => {
    setErrorText("");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicReady(true);
    } catch (error: unknown) {
      setErrorText(buildErrorText(error));
    }
  };

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
      const newConversationId = await conversation.startSession({
        agentId: agentIdFromEnv,
        connectionType,
        userId: userId ? userId : undefined,
      });
      setConversationId(newConversationId);
    } catch (error: unknown) {
      setErrorText(buildErrorText(error));
    }
  };

  const handleEndSession = async (): Promise<void> => {
    setErrorText("");
    try {
      await conversation.endSession();
    } catch (error: unknown) {
      setErrorText(buildErrorText(error));
    }
  };

  const handleSendMessage = (): void => {
    const trimmedText = inputText.trim();
    if (!trimmedText) {
      return;
    }
    conversation.sendUserMessage(trimmedText);
    setInputText("");
  };

  const handleChangeInputText = (value: string): void => {
    setInputText(value);
    conversation.sendUserActivity();
  };

  const handleChangeVolumeRate = (value: number): void => {
    setVolumeRate(value);
  };

  const handleToggleMute = (): void => {
    setMicMuted((prevValue) => !prevValue);
  };

  const handleSendFeedback = (isPositive: boolean): void => {
    conversation.sendFeedback(isPositive);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>ElevenLabs React SDK サンプル</h1>
          <p className="app-subtitle">
            Agents の音声会話とテキスト入力を同時に試せます。
          </p>
        </div>
        <div className="status-panel">
          <span className={`status-badge ${isConnected ? "connected" : ""}`}>
            {statusText}
          </span>
          <span className={`status-badge ${isSpeaking ? "speaking" : ""}`}>
            {isSpeaking ? "speaking" : "listening"}
          </span>
          <span className="status-text">{modeText}</span>
        </div>
      </header>

      <section className="grid">
        <div className="card">
          <h2>接続設定</h2>
          <div className="field">
            <label htmlFor="agent-id">Agent ID（環境変数）</label>
            <input
              id="agent-id"
              type="text"
              placeholder="VITE_ELEVENLABS_AGENT_ID を設定してください"
              value={agentIdFromEnv}
              disabled
            />
          </div>
          <div className="field">
            <label htmlFor="user-id">User ID（任意）</label>
            <input
              id="user-id"
              type="text"
              placeholder="例: user_001"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="connection-type">Connection Type</label>
            <select
              id="connection-type"
              value={connectionType}
              onChange={(event) =>
                setConnectionType(event.target.value as ConnectionType)
              }
            >
              <option value="webrtc">webrtc</option>
              <option value="websocket">websocket</option>
            </select>
          </div>
          <div className="actions">
            <button className="primary" onClick={handleRequestMic}>
              マイク許可を取得
            </button>
            <button
              className="primary"
              onClick={handleStartSession}
              disabled={isConnected}
            >
              セッション開始
            </button>
            <button
              className="secondary"
              onClick={handleEndSession}
              disabled={!isConnected}
            >
              セッション終了
            </button>
          </div>
          <div className="meta">
            <div>
              <span className="meta-label">Conversation ID</span>
              <span className="meta-value">{conversationId || "未接続"}</span>
            </div>
            <div>
              <span className="meta-label">Mic Ready</span>
              <span className="meta-value">
                {micReady ? "取得済み" : "未取得"}
              </span>
            </div>
          </div>
          {errorText && <div className="error">{errorText}</div>}
        </div>

        <div className="card">
          <h2>音量とミュート</h2>
          <div className="field">
            <label htmlFor="volume-rate">Volume</label>
            <input
              id="volume-rate"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volumeRate}
              onChange={(event) =>
                handleChangeVolumeRate(Number(event.target.value))
              }
            />
            <span className="range-value">{volumeRate.toFixed(2)}</span>
          </div>
          <div className="actions">
            <button className="secondary" onClick={handleToggleMute}>
              {micMuted ? "ミュート解除" : "ミュート"}
            </button>
          </div>
          <div className="field">
            <label htmlFor="text-message">テキスト送信</label>
            <div className="input-row">
              <input
                id="text-message"
                type="text"
                value={inputText}
                placeholder="メッセージを入力"
                onChange={(event) => handleChangeInputText(event.target.value)}
              />
              <button className="primary" onClick={handleSendMessage}>
                送信
              </button>
            </div>
          </div>
          <div className="actions">
            <button
              className="ghost"
              onClick={() => handleSendFeedback(true)}
              disabled={!canSendFeedback}
            >
              👍 良い
            </button>
            <button
              className="ghost"
              onClick={() => handleSendFeedback(false)}
              disabled={!canSendFeedback}
            >
              👎 改善
            </button>
          </div>
        </div>
      </section>

      <section className="card log">
        <div className="log-header">
          <h2>会話ログ</h2>
          <button
            className="ghost"
            onClick={() => setMessages([])}
            disabled={messages.length === 0}
          >
            クリア
          </button>
        </div>
        {messages.length === 0 ? (
          <p className="empty">まだメッセージがありません。</p>
        ) : (
          <ul className="message-list">
            {messages.map((message) => (
              <li key={message.id} className={`message ${message.role}`}>
                <span className="message-role">{message.role}</span>
                <span className="message-text">{message.text}</span>
                <span className="message-meta">
                  {message.isFinal ? "final" : "partial"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default App;
