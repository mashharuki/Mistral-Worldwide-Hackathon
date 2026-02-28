#!/bin/bash

# Variable to store the name of the circuit
# CIRCUIT=PasswordHash
CIRCUIT=LicensePlateCommitment

# In case there is a circuit name as input
if [ "$1" ]; then
    CIRCUIT=$1
fi

# Compile the circuit
circom ./src/${CIRCUIT}.circom --r1cs --wasm --sym --c

# Generate the witness.wtns
INPUT_FILE=./data/${CIRCUIT}.json
if [ ! -f "$INPUT_FILE" ]; then
    INPUT_FILE=./data/input.json
fi

node ${CIRCUIT}_js/generate_witness.js ${CIRCUIT}_js/${CIRCUIT}.wasm "$INPUT_FILE" ${CIRCUIT}_js/witness.wtns
