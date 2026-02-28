#!/bin/bash
set -euo pipefail

# Default circuits when no argument is provided
DEFAULT_CIRCUITS=("VoiceCommitment" "VoiceOwnership")

if [ "$#" -gt 0 ]; then
    CIRCUITS=("$@")
else
    CIRCUITS=("${DEFAULT_CIRCUITS[@]}")
fi

for CIRCUIT in "${CIRCUITS[@]}"; do
    echo "----- Compile ${CIRCUIT} -----"
    circom "./src/${CIRCUIT}.circom" --r1cs --wasm --sym --c
done
