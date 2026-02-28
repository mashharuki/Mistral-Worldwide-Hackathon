#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${BACKEND_DIR}/../.." && pwd)"

SOURCE_CIRCUIT_DIR="${SOURCE_CIRCUIT_DIR:-${PROJECT_ROOT}/pkgs/circuit}"
TARGET_ZK_DIR="${TARGET_ZK_DIR:-${BACKEND_DIR}/zk}"

DEFAULT_CIRCUITS=("VoiceCommitment" "VoiceOwnership")
if [[ "$#" -gt 0 ]]; then
  CIRCUITS=("$@")
else
  CIRCUITS=("${DEFAULT_CIRCUITS[@]}")
fi

echo "Source circuit dir: ${SOURCE_CIRCUIT_DIR}"
echo "Target zk dir:      ${TARGET_ZK_DIR}"

mkdir -p "${TARGET_ZK_DIR}/zkey"

for CIRCUIT in "${CIRCUITS[@]}"; do
  SRC_WASM="${SOURCE_CIRCUIT_DIR}/${CIRCUIT}_js/${CIRCUIT}.wasm"
  SRC_ZKEY="${SOURCE_CIRCUIT_DIR}/zkey/${CIRCUIT}_final.zkey"
  SRC_VKEY="${SOURCE_CIRCUIT_DIR}/zkey/${CIRCUIT}_verification_key.json"

  if [[ ! -f "${SRC_WASM}" ]]; then
    echo "Missing wasm: ${SRC_WASM}"
    exit 1
  fi
  if [[ ! -f "${SRC_ZKEY}" ]]; then
    echo "Missing zkey: ${SRC_ZKEY}"
    exit 1
  fi

  mkdir -p "${TARGET_ZK_DIR}/${CIRCUIT}_js"
  cp "${SRC_WASM}" "${TARGET_ZK_DIR}/${CIRCUIT}_js/${CIRCUIT}.wasm"
  cp "${SRC_ZKEY}" "${TARGET_ZK_DIR}/zkey/${CIRCUIT}_final.zkey"

  if [[ -f "${SRC_VKEY}" ]]; then
    cp "${SRC_VKEY}" "${TARGET_ZK_DIR}/zkey/${CIRCUIT}_verification_key.json"
  fi

  echo "Copied artifacts for ${CIRCUIT}"
done

echo "Done."
