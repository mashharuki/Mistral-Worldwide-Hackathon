import json
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, List


class ProofGenerationError(ValueError):
    pass


def _validate_packed_features(values: List[int], name: str) -> None:
    if len(values) != 8:
        raise ProofGenerationError(f"{name} must contain 8 packed field elements")
    for value in values:
        if not isinstance(value, int):
            raise ProofGenerationError(f"{name} must contain integers")
        if value < 0 or value >= (1 << 64):
            raise ProofGenerationError(f"{name} values must be in [0, 2^64)")


def hamming_distance_from_packed(reference_features: List[int], current_features: List[int]) -> int:
    _validate_packed_features(reference_features, "referenceFeatures")
    _validate_packed_features(current_features, "currentFeatures")
    distance = 0
    for ref, cur in zip(reference_features, current_features):
        distance += bin(ref ^ cur).count("1")
    return distance


def ensure_hamming_threshold(reference_features: List[int], current_features: List[int], threshold: int = 128) -> int:
    distance = hamming_distance_from_packed(reference_features, current_features)
    if distance > threshold:
        raise ProofGenerationError(
            f"hamming distance {distance} exceeds threshold {threshold}"
        )
    return distance


def compute_poseidon_commitment(features: List[int], salt: str, circuit_root: Path) -> str:
    _validate_packed_features(features, "features")
    try:
        salt_int = int(salt)
    except ValueError as error:
        raise ProofGenerationError("salt must be an integer string") from error
    if salt_int < 0:
        raise ProofGenerationError("salt must be non-negative")

    prover_result = run_snarkjs_groth16(
        input_payload={
            "voiceFeatures": [str(value) for value in features],
            "salt": str(salt_int),
        },
        circuit_name="VoiceCommitment",
        circuit_root=circuit_root,
    )
    public_signals = prover_result.get("publicSignals", [])
    if not public_signals:
        raise ProofGenerationError("failed to derive commitment from VoiceCommitment circuit")
    return str(public_signals[0])


def run_snarkjs_groth16(input_payload: Dict[str, object], circuit_name: str, circuit_root: Path) -> Dict[str, object]:
    wasm_path = circuit_root / f"{circuit_name}_js" / f"{circuit_name}.wasm"
    zkey_path = circuit_root / "zkey" / f"{circuit_name}_final.zkey"
    if not wasm_path.exists() or not zkey_path.exists():
        raise ProofGenerationError(
            f"missing zk artifacts: {wasm_path} or {zkey_path}"
        )

    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / "input.json"
        proof_path = temp_path / "proof.json"
        public_path = temp_path / "public.json"
        input_path.write_text(json.dumps(input_payload), encoding="utf-8")

        command = [
            "snarkjs",
            "groth16",
            "fullprove",
            str(input_path),
            str(wasm_path),
            str(zkey_path),
            str(proof_path),
            str(public_path),
        ]

        process = subprocess.run(
            command,
            check=False,
            capture_output=True,
            text=True,
        )
        if process.returncode != 0:
            raise ProofGenerationError(
                f"snarkjs fullprove failed: {process.stderr.strip() or process.stdout.strip()}"
            )

        return {
            "proof": json.loads(proof_path.read_text(encoding="utf-8")),
            "publicSignals": json.loads(public_path.read_text(encoding="utf-8")),
        }


def build_generate_proof_response(
    reference_features: List[int],
    current_features: List[int],
    salt: str,
    circuit_name: str,
    circuit_root: Path,
    hamming_threshold: int = 128,
) -> Dict[str, object]:
    distance = ensure_hamming_threshold(reference_features, current_features, hamming_threshold)
    commitment = compute_poseidon_commitment(reference_features, salt, circuit_root)
    prover_result = run_snarkjs_groth16(
        input_payload={
            "referenceFeatures": [str(value) for value in reference_features],
            "currentFeatures": [str(value) for value in current_features],
            "salt": str(salt),
            "publicCommitment": str(commitment),
        },
        circuit_name=circuit_name,
        circuit_root=circuit_root,
    )

    if prover_result["publicSignals"]:
        commitment = str(prover_result["publicSignals"][0])

    return {
        "proof": prover_result["proof"],
        "publicSignals": prover_result["publicSignals"],
        "commitment": commitment,
        "hammingDistance": distance,
    }
