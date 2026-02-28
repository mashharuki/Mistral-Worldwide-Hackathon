const fs = require("fs");
const path = require("path");
const circomlibjs = require("circomlibjs");

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

async function main() {
  const circuit = process.argv[2] || "VoiceCommitment";
  if (circuit !== "VoiceCommitment") {
    throw new Error(`Unsupported circuit: ${circuit}`);
  }

  const { input, commitment } = await createVoiceCommitmentInput();
  const dataDir = path.join(__dirname, "../data");
  const circuitInputPath = path.join(dataDir, `${circuit}.json`);
  const legacyInputPath = path.join(dataDir, "input.json");

  fs.writeFileSync(circuitInputPath, `${JSON.stringify(input, null, 2)}\n`);
  fs.writeFileSync(legacyInputPath, `${JSON.stringify(input, null, 2)}\n`);

  console.log("Generated input file:", circuitInputPath);
  console.log("Updated fallback input file:", legacyInputPath);
  console.log("Expected commitment:", commitment);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
