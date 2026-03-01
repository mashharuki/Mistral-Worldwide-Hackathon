// Helper functions for the application
import {
  type MessageItem,
  type MessageRole,
  type VoiceActivityState,
  type VoiceConnectionState,
} from "./types";

/**
 * Generates a random ID string
 * @returns Random ID in format: timestamp-randomString
 */
export const getRandomId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

/**
 * Type guard to check if value is a record/object
 * @param value - Value to check
 * @returns True if value is a record/object
 */
export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

/**
 * Safely gets string value from unknown
 * @param value - Value to convert
 * @returns String value or empty string
 */
export const getStringValue = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};

/**
 * Safely gets boolean value from unknown
 * @param value - Value to convert
 * @returns Boolean value or false
 */
export const getBooleanValue = (value: unknown): boolean => {
  return typeof value === "boolean" ? value : false;
};

/**
 * Converts unknown value to MessageRole
 * @param value - Value to convert
 * @returns Valid MessageRole
 */
export const getMessageRole = (value: unknown): MessageRole => {
  const roleValue = getStringValue(value).toLowerCase();
  if (roleValue === "user" || roleValue === "agent" || roleValue === "debug") {
    return roleValue;
  }
  return "system";
};

/**
 * Builds a MessageItem from unknown message data
 * @param message - Raw message data
 * @returns MessageItem with safe defaults
 */
export const buildMessageItem = (message: unknown): MessageItem => {
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

/**
 * Converts error to string representation
 * @param error - Error to convert
 * @returns String representation of error
 */
export const buildErrorText = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return JSON.stringify(error);
};

/**
 * Converts status text to VoiceConnectionState
 * @param statusText - Status text
 * @returns VoiceConnectionState
 */
export const buildConnectionState = (
  statusText: string,
): VoiceConnectionState => {
  if (statusText === "connected") {
    return "connected";
  }
  if (statusText === "connecting") {
    return "connecting";
  }
  return "disconnected";
};

/**
 * Converts mode text and speaking state to VoiceActivityState
 * @param modeText - Mode text
 * @param isSpeaking - Whether voice is speaking
 * @returns VoiceActivityState
 */
export const buildActivityState = (
  modeText: string,
  isSpeaking: boolean,
): VoiceActivityState => {
  if (isSpeaking) {
    return "speaking";
  }

  if (modeText === "speaking") {
    return "speaking";
  }
  if (modeText === "listening") {
    return "listening";
  }
  if (modeText === "thinking") {
    return "thinking";
  }
  return "idle";
};

/**
 * Clamps voice level to valid range [0, 1]
 * @param value - Voice level
 * @returns Clamped value between 0 and 1
 */
export const clampVoiceLevel = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
};

/**
 * Gets pulse scale based on activity state and voice level
 * @param activityState - Current activity state
 * @param voiceLevel - Current voice level (0-1)
 * @returns Pulse scale factor
 */
export const getPulseScale = (
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
    return 1.02 + voiceLevel * 0.08;
  }
  return 1.0;
};

export const asString = (value: unknown): string => {
  return typeof value === "string" ? value : "";
};
