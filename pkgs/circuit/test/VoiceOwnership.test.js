const path = require("path");
const wasm_tester = require("circom_tester").wasm;
const { buildPoseidon } = require("circomlibjs");

async function expectFailure(promise, label) {
  try {
    await promise;
    throw new Error(`Expected failure: ${label}`);
  } catch {
    // expected
  }
}

async function commitmentOf(features, salt) {
  const poseidon = await buildPoseidon();
  return poseidon.F.toString(poseidon([...features, salt]));
}

/**
 * Tests for the VoiceOwnership circuit, which verifies that the Hamming distance between the reference and current features is at most 128, and that the commitment matches.
 */
async function run() {
  const circuit = await wasm_tester(
    path.join(__dirname, "../src/VoiceOwnership.circom"),
  );

  const max64 = (1n << 64n) - 1n;
  const salt = 42n;
  const reference = [0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n];
  const publicCommitment = await commitmentOf(reference, salt);

  const within127 = [max64, max64 - 1n, 0n, 0n, 0n, 0n, 0n, 0n];
  const witness127 = await circuit.calculateWitness(
    {
      referenceFeatures: reference.map(String),
      currentFeatures: within127.map(String),
      salt: salt.toString(),
      publicCommitment,
    },
    true,
  );
  await circuit.checkConstraints(witness127);

  const onBoundary128 = [max64, max64, 0n, 0n, 0n, 0n, 0n, 0n];
  const witness128 = await circuit.calculateWitness(
    {
      referenceFeatures: reference.map(String),
      currentFeatures: onBoundary128.map(String),
      salt: salt.toString(),
      publicCommitment,
    },
    true,
  );
  await circuit.checkConstraints(witness128);

  const over129 = [max64, max64, 1n, 0n, 0n, 0n, 0n, 0n];
  await expectFailure(
    circuit.calculateWitness(
      {
        referenceFeatures: reference.map(String),
        currentFeatures: over129.map(String),
        salt: salt.toString(),
        publicCommitment,
      },
      true,
    ),
    "hamming distance > 128 should fail",
  );

  await expectFailure(
    circuit.calculateWitness(
      {
        referenceFeatures: reference.map(String),
        currentFeatures: onBoundary128.map(String),
        salt: salt.toString(),
        publicCommitment: "123",
      },
      true,
    ),
    "commitment mismatch should fail",
  );

  console.log("VoiceOwnership tests passed");
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
