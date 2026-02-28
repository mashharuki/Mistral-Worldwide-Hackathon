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

    INPUT_FILE="./data/${CIRCUIT}.json"
    if [ ! -f "$INPUT_FILE" ]; then
        INPUT_FILE="./data/input.json"
    fi

    echo "----- Generate witness ${CIRCUIT} (input: ${INPUT_FILE}) -----"
    node "${CIRCUIT}_js/generate_witness.js" "${CIRCUIT}_js/${CIRCUIT}.wasm" "$INPUT_FILE" "${CIRCUIT}_js/witness.wtns"
done
