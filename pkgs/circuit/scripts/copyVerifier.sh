#!/bin/bash
set -euo pipefail

DEFAULT_CIRCUITS=("VoiceCommitment" "VoiceOwnership")
TARGET_DIR="../contract/contracts"

CIRCUITS=()
while [ "$#" -gt 0 ]; do
    case "$1" in
        --)
            shift
            ;;
        *)
            CIRCUITS+=("$1")
            shift
            ;;
    esac
done

if [ "${#CIRCUITS[@]}" -eq 0 ]; then
    CIRCUITS=("${DEFAULT_CIRCUITS[@]}")
fi

mkdir -p "$TARGET_DIR"

for CIRCUIT in "${CIRCUITS[@]}"; do
    SRC_FILE="./${CIRCUIT}Verifier.sol"
    if [ ! -f "$SRC_FILE" ]; then
        echo "Verifier not found: ${SRC_FILE}"
        exit 1
    fi

    cp "$SRC_FILE" "$TARGET_DIR/${CIRCUIT}Verifier.sol"
    echo "Copied ${SRC_FILE} -> ${TARGET_DIR}/${CIRCUIT}Verifier.sol"
done
