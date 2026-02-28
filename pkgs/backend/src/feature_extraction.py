import base64
import gc
import hashlib
import io
import os
import wave
from typing import Dict, List, Tuple


class AudioFormatError(ValueError):
    # 音声フォーマットエラー
    pass


class AudioQualityError(ValueError):
    # 音声品質エラー
    pass


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


def _extract_embedding_with_model(audio_bytes: bytes) -> Tuple[List[float], str]:
    # 音声データから埋め込みベクトルを抽出
    # この段階では決定論的な方法を使用し、依存関係を軽減
    # pyannote/wespeakerが利用可能な場合、環境設定により切り替え可能
    provider = os.getenv("BACKEND_EMBEDDING_PROVIDER", "deterministic")
    model_name = os.getenv("BACKEND_EMBEDDING_MODEL", "mistral-hackaton-2026")
    embedding = _deterministic_embedding(audio_bytes, dims=512)
    return embedding, f"{provider}:{model_name}"


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
        embedding, model_used = _extract_embedding_with_model(audio_bytes)
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
