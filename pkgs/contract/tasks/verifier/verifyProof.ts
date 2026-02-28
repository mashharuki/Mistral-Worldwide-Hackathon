import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】Call verifyProof on a deployed Groth16 verifier
 */
task("verifyProof", "Verify a Groth16 proof on a deployed verifier")
  .addParam("verifier", "Verifier contract address")
  .addParam(
    "proof",
    "JSON string of proof: {a:[2], b:[[2],[2]], c:[2], input:[1]}",
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const verifier = await hre.ethers.getContractAt(
      "IGroth16Verifier",
      taskArgs.verifier,
    );

    let proofData: {
      a: [string, string];
      b: [[string, string], [string, string]];
      c: [string, string];
      input: [string];
    };
    try {
      proofData = JSON.parse(taskArgs.proof);
    } catch {
      throw new Error(
        'Invalid proof JSON. Expected: {"a":[...], "b":[[...],[...]], "c":[...], "input":[...]}',
      );
    }

    console.log("Verifier:", taskArgs.verifier);
    console.log("Proof a:", proofData.a);
    console.log("Proof b:", proofData.b);
    console.log("Proof c:", proofData.c);
    console.log("Public input:", proofData.input);

    const result = await verifier.verifyProof(
      proofData.a,
      proofData.b,
      proofData.c,
      proofData.input,
    );

    console.log("Verification Result:", result ? "VALID" : "INVALID");

    console.log(
      "################################### [END] ###################################",
    );
  });
