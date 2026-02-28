#!/bin/bash
set -euo pipefail

DEFAULT_CIRCUITS=("VoiceCommitment" "VoiceOwnership")
PTAU=14
CIRCUITS=()

while [ "$#" -gt 0 ]; do
    case "$1" in
        -p|--ptau)
            PTAU="$2"
            shift 2
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

run_snarkjs_safe() {
    local expected_file="$1"
    shift

    local log_file
    log_file="$(mktemp)"

    set +e
    "$@" >"$log_file" 2>&1
    local status=$?
    set -e

    cat "$log_file"

    if [ "$status" -ne 0 ]; then
        if grep -q "ERR_INVALID_ARG_TYPE" "$log_file" && grep -q "Received an instance of Uint8Array" "$log_file"; then
            if [ -n "$expected_file" ] && [ -f "$expected_file" ]; then
                echo "----- snarkjs Node 23 workaround applied (output exists): ${expected_file} -----"
                rm -f "$log_file"
                return 0
            fi
        fi

        rm -f "$log_file"
        return "$status"
    fi

    rm -f "$log_file"
}

# Check if the necessary ptau file already exists. If it does not exist, it will be downloaded from the data center
if [ -f ./ptau/powersOfTau28_hez_final_${PTAU}.ptau ]; then
    echo "----- powersOfTau28_hez_final_${PTAU}.ptau already exists -----"
else
    echo "----- Download powersOfTau28_hez_final_${PTAU}.ptau -----"
    wget -P ./ptau https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_${PTAU}.ptau
fi

for CIRCUIT in "${CIRCUITS[@]}"; do
    echo "==================== ${CIRCUIT} ===================="
    echo "----- Compile ${CIRCUIT} -----"
    circom "./src/${CIRCUIT}.circom" --r1cs --wasm --sym --c

    INPUT_FILE="./data/${CIRCUIT}.json"
    if [ ! -f "$INPUT_FILE" ]; then
        INPUT_FILE="./data/input.json"
    fi

    echo "----- Generate witness ${CIRCUIT} (input: ${INPUT_FILE}) -----"
    node "${CIRCUIT}_js/generate_witness.js" "${CIRCUIT}_js/${CIRCUIT}.wasm" "$INPUT_FILE" "${CIRCUIT}_js/witness.wtns"

    echo "----- Generate .zkey file (${CIRCUIT}) -----"
    run_snarkjs_safe "./zkey/${CIRCUIT}_0000.zkey" \
        snarkjs groth16 setup "${CIRCUIT}.r1cs" "ptau/powersOfTau28_hez_final_${PTAU}.ptau" "./zkey/${CIRCUIT}_0000.zkey"

    echo "----- Contribute to phase 2 (${CIRCUIT}) -----"
    run_snarkjs_safe "./zkey/${CIRCUIT}_final.zkey" \
        snarkjs zkey contribute "./zkey/${CIRCUIT}_0000.zkey" "./zkey/${CIRCUIT}_final.zkey" --name="1st Contributor Name" -v -e="some random text"

    echo "----- Export verification key (${CIRCUIT}) -----"
    snarkjs zkey export verificationkey "./zkey/${CIRCUIT}_final.zkey" "./zkey/${CIRCUIT}_verification_key.json"

    echo "----- Generate zk-proof (${CIRCUIT}) -----"
    snarkjs groth16 prove "./zkey/${CIRCUIT}_final.zkey" "${CIRCUIT}_js/witness.wtns" "./data/${CIRCUIT}_proof.json" "./data/${CIRCUIT}_public.json"

    echo "----- Verify proof (${CIRCUIT}) -----"
    snarkjs groth16 verify "./zkey/${CIRCUIT}_verification_key.json" "./data/${CIRCUIT}_public.json" "./data/${CIRCUIT}_proof.json"

    echo "----- Generate Solidity verifier (${CIRCUIT}) -----"
    snarkjs zkey export solidityverifier "./zkey/${CIRCUIT}_final.zkey" "${CIRCUIT}Verifier.sol"
    sed 's/0.6.11;/0.8.20;/g' "${CIRCUIT}Verifier.sol" > "${CIRCUIT}Verifier2.sol"
    sed "s/contract Verifier/contract ${CIRCUIT}Verifier/g" "${CIRCUIT}Verifier2.sol" > "${CIRCUIT}Verifier.sol"
    rm "${CIRCUIT}Verifier2.sol"

    echo "----- Generate calldata (${CIRCUIT}) -----"
    snarkjs generatecall "./data/${CIRCUIT}_public.json" "./data/${CIRCUIT}_proof.json" | tee "./data/${CIRCUIT}_calldata.json"
done
