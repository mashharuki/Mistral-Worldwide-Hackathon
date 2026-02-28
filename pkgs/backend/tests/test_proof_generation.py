import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from proof_generation import (
    ProofGenerationError,
    build_generate_proof_response,
    ensure_hamming_threshold,
    hamming_distance_from_packed,
    run_snarkjs_groth16,
)


class ProofGenerationTest(unittest.TestCase):
    def test_hamming_distance_from_packed(self):
        reference = [0] * 8
        current = [(1 << 64) - 1, 0, 0, 0, 0, 0, 0, 0]
        self.assertEqual(hamming_distance_from_packed(reference, current), 64)

    def test_ensure_hamming_threshold_rejects_over_limit(self):
        reference = [0] * 8
        current = [(1 << 64) - 1, (1 << 64) - 1, 1, 0, 0, 0, 0, 0]  # 129 bits
        with self.assertRaises(ProofGenerationError):
            ensure_hamming_threshold(reference, current, threshold=128)

    @patch("proof_generation.subprocess.run")
    def test_run_snarkjs_groth16_invokes_fullprove(self, mock_run):
        def _mock_subprocess(command, check, capture_output, text):
            Path(command[-2]).write_text(json.dumps({"pi_a": []}), encoding="utf-8")
            Path(command[-1]).write_text(json.dumps(["123"]), encoding="utf-8")
            mock_process = unittest.mock.Mock()
            mock_process.returncode = 0
            mock_process.stderr = ""
            mock_process.stdout = ""
            return mock_process

        mock_run.side_effect = _mock_subprocess
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            wasm_dir = temp_path / "VoiceOwnership_js"
            zkey_dir = temp_path / "zkey"
            wasm_dir.mkdir(parents=True, exist_ok=True)
            zkey_dir.mkdir(parents=True, exist_ok=True)
            (wasm_dir / "VoiceOwnership.wasm").write_bytes(b"wasm")
            (zkey_dir / "VoiceOwnership_final.zkey").write_bytes(b"zkey")

            result = run_snarkjs_groth16(
                input_payload={"foo": "bar"},
                circuit_name="VoiceOwnership",
                circuit_root=temp_path,
            )

            self.assertIn("proof", result)
            self.assertIn("publicSignals", result)
            called_cmd = mock_run.call_args[0][0]
            self.assertEqual(called_cmd[:3], ["snarkjs", "groth16", "fullprove"])
            self.assertTrue(called_cmd[3].endswith("input.json"))

    @patch("proof_generation.run_snarkjs_groth16")
    @patch("proof_generation.compute_poseidon_commitment")
    def test_build_generate_proof_response(self, mock_commitment, mock_prover):
        mock_commitment.return_value = "999"
        mock_prover.return_value = {
            "proof": {"pi_a": ["1", "2"]},
            "publicSignals": ["999"],
        }
        response = build_generate_proof_response(
            reference_features=[0] * 8,
            current_features=[0] * 8,
            salt="123",
            circuit_name="VoiceOwnership",
            circuit_root=Path("."),
            hamming_threshold=128,
        )
        self.assertEqual(response["commitment"], "999")
        self.assertEqual(response["publicSignals"], ["999"])


if __name__ == "__main__":
    unittest.main()
