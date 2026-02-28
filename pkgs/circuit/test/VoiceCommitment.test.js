const path = require("path");
const { expect } = require("chai");
const wasm_tester = require("circom_tester").wasm;
const { buildPoseidon } = require("circomlibjs");

async function expectFailure(promise) {
  try {
    await promise;
    throw new Error("Expected circuit execution to fail");
  } catch {
    // expected
  }
}

/**
 * テスト用のスクリプト
 */
async function run() {
  // サーキットのコンパイルとPoseidonハッシュ関数のビルド
  const circuit = await wasm_tester(
    path.join(__dirname, "../src/VoiceCommitment.circom"),
  );
  const poseidon = await buildPoseidon();

  // test voice features and salt for the circuit test
  const voiceFeatures = [
    1n,
    2n,
    3n,
    4n,
    5n,
    6n,
    7n,
    8n,
  ];
  const salt = 999n;

  // generate witness and check constraints
  const witness = await circuit.calculateWitness(
    {
      voiceFeatures: voiceFeatures.map((value) => value.toString()),
      salt: salt.toString(),
    },
    true,
  );
  // check constraints
  await circuit.checkConstraints(witness);

  // calculate expected commitment and assert output
  const expectedCommitment = poseidon.F.toString(poseidon([...voiceFeatures, salt]));
  await circuit.assertOut(witness, { commitment: expectedCommitment });

  const tooLarge = (1n << 64n).toString();
  await expectFailure(
    circuit.calculateWitness(
      {
        voiceFeatures: [
          tooLarge,
          "0",
          "0",
          "0",
          "0",
          "0",
          "0",
          "0",
        ],
        salt: "1",
      },
      true,
    ),
  );

  console.log("VoiceCommitment tests passed");
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
