const fs = require("fs");
const path = require("path");
const circomlibjs = require("circomlibjs");

const DEFAULT_CIRCUITS = ["VoiceCommitment", "VoiceOwnership"];

function defaultVoiceFeatures() {
  return [
    1n,
    2n,
    3n,
    4n,
    5n,
    6n,
    7n,
    8n,
  ];
}

async function createVoiceCommitmentInput() {
  const poseidon = await circomlibjs.buildPoseidon();
  const voiceFeatures = defaultVoiceFeatures();
  const salt = 999n;
  const commitment = poseidon.F.toString(poseidon([...voiceFeatures, salt]));

  return {
    input: {
      voiceFeatures: voiceFeatures.map((value) => value.toString()),
      salt: salt.toString(),
    },
    commitment,
  };
}

async function createVoiceOwnershipInput() {
  const poseidon = await circomlibjs.buildPoseidon();
  const salt = 42n;
  const referenceFeatures = [
    0n,
    0n,
    0n,
    0n,
    0n,
    0n,
    0n,
    0n,
  ];
  const currentFeatures = [
    (1n << 64n) - 1n,
    (1n << 63n) - 1n,
    0n,
    0n,
    0n,
    0n,
    0n,
    0n,
  ];
  const publicCommitment = poseidon.F.toString(
    poseidon([...referenceFeatures, salt]),
  );

  return {
    input: {
      referenceFeatures: referenceFeatures.map((value) => value.toString()),
      currentFeatures: currentFeatures.map((value) => value.toString()),
      salt: salt.toString(),
      publicCommitment,
    },
    commitment: publicCommitment,
  };
}

async function buildInputForCircuit(circuit) {
  if (circuit === "VoiceCommitment") {
    return createVoiceCommitmentInput();
  }
  if (circuit === "VoiceOwnership") {
    return createVoiceOwnershipInput();
  }
  throw new Error(`Unsupported circuit: ${circuit}`);
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function main() {
  const circuits = process.argv.slice(2);
  const targetCircuits = circuits.length > 0 ? circuits : DEFAULT_CIRCUITS;
  const dataDir = path.join(__dirname, "../data");

  for (const circuit of targetCircuits) {
    const { input, commitment } = await buildInputForCircuit(circuit);
    const circuitInputPath = path.join(dataDir, `${circuit}.json`);
    writeJson(circuitInputPath, input);

    if (circuit === "VoiceCommitment") {
      const legacyInputPath = path.join(dataDir, "input.json");
      writeJson(legacyInputPath, input);
      console.log("Updated fallback input file:", legacyInputPath);
    }

    console.log("Generated input file:", circuitInputPath);
    console.log("Expected commitment:", commitment);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
