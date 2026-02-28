import base64
import io
import math
import struct
import unittest
import wave

from feature_extraction import (
    AudioFormatError,
    AudioQualityError,
    decode_audio_base64,
    extract_voice_features,
    pack_binary_features,
)


def generate_wav_base64(seconds: float, sample_rate: int = 16000) -> str:
    total_samples = int(sample_rate * seconds)
    buffer = io.BytesIO()

    with wave.open(buffer, "wb") as writer:
        writer.setnchannels(1)
        writer.setsampwidth(2)
        writer.setframerate(sample_rate)

        frames = bytearray()
        for i in range(total_samples):
            value = int(32767 * math.sin(2 * math.pi * 440 * i / sample_rate))
            frames.extend(struct.pack("<h", value))
        writer.writeframes(bytes(frames))

    return base64.b64encode(buffer.getvalue()).decode("ascii")


class FeatureExtractionTest(unittest.TestCase):
    def test_decode_audio_base64_rejects_invalid_payload(self):
        with self.assertRaises(AudioFormatError):
            decode_audio_base64("not-base64!")

    def test_extract_voice_features_returns_expected_shapes(self):
        audio_b64 = generate_wav_base64(1.2)
        result = extract_voice_features(audio_b64)

        self.assertEqual(result["format"], "wav")
        self.assertEqual(len(result["features"]), 512)
        self.assertEqual(len(result["binaryFeatures"]), 512)
        self.assertEqual(len(result["packedFeatures"]), 8)
        self.assertTrue(all(bit in (0, 1) for bit in result["binaryFeatures"]))

    def test_extract_voice_features_rejects_too_short_audio(self):
        short_audio_b64 = generate_wav_base64(0.5)
        with self.assertRaises(AudioQualityError):
            extract_voice_features(short_audio_b64)

    def test_pack_binary_features_requires_exact_512_bits(self):
        with self.assertRaises(ValueError):
            pack_binary_features([0, 1, 1])


if __name__ == "__main__":
    unittest.main()
