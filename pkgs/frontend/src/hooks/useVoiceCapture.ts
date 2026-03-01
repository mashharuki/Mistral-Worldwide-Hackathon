import { useCallback, useEffect, useRef, useState } from "react";
import { extractVoiceFeatures, type ExtractFeaturesResponse } from "../lib/backendApi";

const MAX_CHUNKS = 5;
const TIMESLICE_MS = 1000;

export type VoiceCaptureState = "idle" | "buffering" | "extracting" | "error";

export type UseVoiceCaptureResult = {
  state: VoiceCaptureState;
  startBuffering: () => Promise<void>;
  stopBuffering: () => void;
  captureAndExtract: () => Promise<ExtractFeaturesResponse>;
};

const SUPPORTED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
] as const;

const pickMimeType = (): string | undefined => {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }
  for (const mimeType of SUPPORTED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }
  return undefined;
};

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const buffer = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const useVoiceCapture = (): UseVoiceCaptureResult => {
  const [state, setState] = useState<VoiceCaptureState>("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string | undefined>(undefined);
  const chunksRef = useRef<Blob[]>([]);

  const stopBuffering = useCallback(() => {
    try {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    } catch {
      // no-op
    }

    recorderRef.current = null;

    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
    }

    streamRef.current = null;
    chunksRef.current = [];
    setState("idle");
  }, []);

  const startBuffering = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = pickMimeType();
    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mimeTypeRef.current = mimeType;
    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event: BlobEvent) => {
      if (!event.data || event.data.size === 0) {
        return;
      }
      chunksRef.current.push(event.data);
      if (chunksRef.current.length > MAX_CHUNKS) {
        chunksRef.current.shift();
      }
    };

    recorder.onerror = () => {
      setState("error");
    };

    recorder.start(TIMESLICE_MS);
    setState("buffering");
  }, []);

  const captureAndExtract = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      throw new Error("Voice buffering is not running");
    }

    if (chunksRef.current.length === 0) {
      throw new Error("No buffered audio available yet");
    }

    setState("extracting");

    try {
      const mimeType = mimeTypeRef.current || recorder.mimeType || "audio/webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const audioBase64 = await blobToBase64(blob);

      const result = await extractVoiceFeatures(audioBase64, mimeType);
      setState("buffering");
      return result;
    } catch (error) {
      setState("error");
      throw error;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopBuffering();
    };
  }, [stopBuffering]);

  return {
    state,
    startBuffering,
    stopBuffering,
    captureAndExtract,
  };
};
