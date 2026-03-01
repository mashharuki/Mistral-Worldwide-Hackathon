import base64
import gc
import hashlib
import io
import os
import subprocess
import wave
from typing import Dict, List, Tuple


class AudioFormatError(ValueError):
    # 音声フォーマットエラー
    pass


class AudioQualityError(ValueError):
    # 音声品質エラー
    pass


class AudioDecodeError(ValueError):
    # 音声デコードエラー
    pass


class EmbeddingModelUnavailableError(RuntimeError):
    # 埋め込みモデル利用不可エラー
    pass


_INFERENCE = None
_INFERENCE_MODEL_NAME = ""


def _error_detail(error: Exception) -> str:
    # 例外から表示可能な詳細文字列を生成
    detail = str(error).strip()
    if detail:
        return detail
    return error.__class__.__name__


def decode_audio_base64(audio_base64: str) -> bytes:
    # Base64エンコードされた音声データをデコード
    try:
        return base64.b64decode(audio_base64, validate=True)
    except Exception as error:
        raise AudioFormatError("audio must be valid base64") from error


def detect_audio_format(audio_bytes: bytes, mime_type: str = "") -> str:
    # 音声データのフォーマットを検出
    lower_mime = mime_type.lower().strip()
    if lower_mime in ("audio/wav", "audio/x-wav", "wav"):
        return "wav"
    if lower_mime in ("audio/webm", "webm"):
        return "webm"

    # マジックナンバーによるフォーマット検出
    if len(audio_bytes) >= 12 and audio_bytes[:4] == b"RIFF" and audio_bytes[8:12] == b"WAVE":
        return "wav"
    if len(audio_bytes) >= 4 and audio_bytes[:4] == bytes([0x1A, 0x45, 0xDF, 0xA3]):
        return "webm"

    raise AudioFormatError("unsupported audio format (expected WAV or WebM)")


def validate_audio_quality(audio_bytes: bytes, audio_format: str, min_seconds: float = 1.0) -> None:
    # 音声データの品質を検証
    if audio_format == "wav":
        with wave.open(io.BytesIO(audio_bytes), "rb") as wav_file:
            frame_rate = wav_file.getframerate()
            frame_count = wav_file.getnframes()
            duration = frame_count / frame_rate if frame_rate else 0
            if duration < min_seconds:
                raise AudioQualityError("audio is too short; minimum 1 second is required")
        return

    if audio_format == "webm":
        # WebM duration parsing requires external decoders in this phase.
        # Use a conservative size heuristic as quality gate fallback.
        if len(audio_bytes) < 12_000:
            raise AudioQualityError("audio is too short; minimum 1 second is required")
        return

    raise AudioFormatError("unsupported audio format")


def _deterministic_embedding(audio_bytes: bytes, dims: int = 512) -> List[float]:
    # 音声データから決定論的な埋め込みベクトルを生成
    values: List[float] = []
    seed = audio_bytes
    counter = 0
    while len(values) < dims:
        digest = hashlib.sha256(seed + counter.to_bytes(4, "big")).digest()
        for index in range(0, len(digest), 4):
            if len(values) >= dims:
                break
            chunk = digest[index : index + 4]
            number = int.from_bytes(chunk, "big", signed=False)
            values.append((number / 0xFFFFFFFF) * 2.0 - 1.0)
        counter += 1
    return values


def _decode_webm_to_wav(audio_bytes: bytes) -> bytes:
    # ffmpeg を使って WebM を WAV(PCM16) に変換
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        "pipe:0",
        "-f",
        "wav",
        "-ac",
        "1",
        "-ar",
        "16000",
        "pipe:1",
    ]
    try:
        result = subprocess.run(
            command,
            input=audio_bytes,
            capture_output=True,
            check=True,
        )
        if not result.stdout:
            raise AudioDecodeError("webm decode produced empty output")
        return result.stdout
    except FileNotFoundError as error:
        raise EmbeddingModelUnavailableError("ffmpeg is not installed") from error
    except subprocess.CalledProcessError as error:
        raise AudioDecodeError("failed to decode WebM audio") from error


def _require_numpy():
    # numpy を遅延ロード
    try:
        import numpy as np
    except Exception as error:
        raise EmbeddingModelUnavailableError("numpy is not available") from error
    return np


def _wav_bytes_to_mono_float32(wav_bytes: bytes):
    # WAVバイト列をモノラルfloat32(-1.0..1.0)へ変換
    np = _require_numpy()
    try:
        with wave.open(io.BytesIO(wav_bytes), "rb") as wav_file:
            sample_rate = wav_file.getframerate()
            channels = wav_file.getnchannels()
            sample_width = wav_file.getsampwidth()
            frame_count = wav_file.getnframes()
            frames = wav_file.readframes(frame_count)
    except wave.Error as error:
        raise AudioDecodeError("invalid WAV payload") from error

    if sample_rate <= 0:
        raise AudioDecodeError("invalid WAV sample rate")
    if channels <= 0:
        raise AudioDecodeError("invalid WAV channels")

    if sample_width == 1:
        raw = np.frombuffer(frames, dtype=np.uint8).astype(np.float32)
        raw = (raw - 128.0) / 128.0
    elif sample_width == 2:
        raw = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
    elif sample_width == 4:
        raw = np.frombuffer(frames, dtype=np.int32).astype(np.float32) / 2147483648.0
    else:
        raise AudioDecodeError(f"unsupported WAV sample width: {sample_width}")

    if channels > 1:
        raw = raw.reshape(-1, channels).mean(axis=1)

    return raw.astype(np.float32), sample_rate


def _resample_to_16k(samples, source_rate: int):
    # 16kHzへ線形補間リサンプリング
    np = _require_numpy()
    target_rate = 16000
    if source_rate == target_rate:
        return samples
    if samples.size == 0:
        raise AudioDecodeError("empty audio samples")

    source_index = np.linspace(0.0, 1.0, num=samples.shape[0], endpoint=False)
    target_length = max(int(samples.shape[0] * target_rate / source_rate), 1)
    target_index = np.linspace(0.0, 1.0, num=target_length, endpoint=False)
    resampled = np.interp(target_index, source_index, samples).astype(np.float32)
    return resampled.astype(np.float32)


def _load_inference(model_name: str):
    # pyannote Inference を遅延ロード
    global _INFERENCE, _INFERENCE_MODEL_NAME
    if _INFERENCE is not None and _INFERENCE_MODEL_NAME == model_name:
        return _INFERENCE

    try:
        from pyannote.audio import Inference, Model
    except Exception as error:
        raise EmbeddingModelUnavailableError("pyannote.audio is not available") from error

    hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_HUB_TOKEN")
    try:
        if hf_token:
            # 引数の互換性差分を避けるため、認証は環境変数経由に統一する。
            os.environ["HF_TOKEN"] = hf_token
            os.environ["HUGGINGFACE_HUB_TOKEN"] = hf_token
        model = Model.from_pretrained(model_name)
        _INFERENCE = Inference(model, window="whole")
        _INFERENCE_MODEL_NAME = model_name
        return _INFERENCE
    except Exception as error:
        raise EmbeddingModelUnavailableError(
            f"failed to load embedding model: {model_name} ({_error_detail(error)})"
        ) from error


def _normalize_embedding_dims(embedding, dims: int = 512) -> List[float]:
    # ベクトル次元を固定長へ正規化
    np = _require_numpy()
    flat = embedding.astype(np.float32).reshape(-1)
    if flat.shape[0] >= dims:
        out = flat[:dims]
    else:
        out = np.zeros(dims, dtype=np.float32)
        out[: flat.shape[0]] = flat
    return out.tolist()


def _extract_embedding_with_model(audio_bytes: bytes, audio_format: str) -> Tuple[List[float], str]:
    # 音声データから埋め込みベクトルを抽出
    provider = os.getenv("BACKEND_EMBEDDING_PROVIDER", "pyannote").strip().lower()
    model_name = os.getenv("BACKEND_EMBEDDING_MODEL", "pyannote/embedding").strip()

    if provider == "deterministic":
        embedding = _deterministic_embedding(audio_bytes, dims=512)
        return embedding, f"{provider}:{model_name}"

    if provider != "pyannote":
        raise EmbeddingModelUnavailableError(f"unsupported embedding provider: {provider}")

    wav_bytes = audio_bytes if audio_format == "wav" else _decode_webm_to_wav(audio_bytes)
    samples, sample_rate = _wav_bytes_to_mono_float32(wav_bytes)
    samples = _resample_to_16k(samples, sample_rate)

    try:
        import torch
    except Exception as error:
        raise EmbeddingModelUnavailableError("torch is not available") from error

    inference = _load_inference(model_name)
    waveform = torch.from_numpy(samples).unsqueeze(0)

    try:
        embedding = inference({"waveform": waveform, "sample_rate": 16000})
    except Exception as error:
        raise EmbeddingModelUnavailableError(
            f"embedding inference failed ({_error_detail(error)})"
        ) from error

    np = _require_numpy()
    embedding_array = np.asarray(embedding, dtype=np.float32)
    normalized = _normalize_embedding_dims(embedding_array, dims=512)
    return normalized, f"{provider}:{model_name}"


def binarize_embedding(embedding: List[float], threshold: float = 0.0) -> List[int]:
    # 埋め込みベクトルを二値化
    return [1 if value >= threshold else 0 for value in embedding]


def pack_binary_features(binary_features: List[int]) -> List[int]:
    # 二値化された特徴量をパック
    if len(binary_features) != 512:
        raise ValueError("binary feature length must be 512")
    if any(bit not in (0, 1) for bit in binary_features):
        raise ValueError("binary features must contain only 0 or 1")

    packed: List[int] = []
    for block_start in range(0, 512, 64):
        block = binary_features[block_start : block_start + 64]
        value = 0
        for bit_index, bit in enumerate(block):
            value |= (bit & 1) << bit_index
        packed.append(value)
    return packed


def extract_voice_features(audio_base64: str, mime_type: str = "") -> Dict[str, object]:
    # 音声データから特徴量を抽出
    audio_bytes = b""
    embedding: List[float] = []
    binary_features: List[int] = []
    packed_features: List[int] = []
    audio_format = ""
    model_used = ""

    try:
        audio_bytes = decode_audio_base64(audio_base64)
        audio_format = detect_audio_format(audio_bytes, mime_type)
        validate_audio_quality(audio_bytes, audio_format, min_seconds=1.0)
        embedding, model_used = _extract_embedding_with_model(audio_bytes, audio_format)
        binary_features = binarize_embedding(embedding)
        packed_features = pack_binary_features(binary_features)

        return {
            "features": embedding,
            "binaryFeatures": binary_features,
            "packedFeatures": packed_features,
            "format": audio_format,
            "modelUsed": model_used,
        }
    finally:
        # メモリ上の敏感なデータを明示的にクリア
        audio_bytes = b""
        embedding = []
        binary_features = []
        packed_features = []
        gc.collect()
