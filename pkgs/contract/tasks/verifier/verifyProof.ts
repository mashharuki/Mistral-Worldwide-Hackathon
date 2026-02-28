import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getVerifierAddress,
  hasDeployedAddresses,
} from "../../helpers/contractJsonHelper";

/**
 * 【Task】Call verifyProof on a deployed Groth16 verifier
 *
 * --verifier 省略時は deployed_addresses.json から自動取得
 */
task("verifyProof", "Verify a Groth16 proof on a deployed verifier")
  .addOptionalParam(
    "verifier",
    "Verifier contract address (auto-resolved from JSON if omitted)",
    undefined,
    types.string,
  )
  .addParam(
    "proof",
    "JSON string of proof: {a:[2], b:[[2],[2]], c:[2], input:[1]}",
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);

    // Verifier アドレスの解決: 引数 > JSON > エラー
    let verifierAddr: string;
    if (taskArgs.verifier) {
      verifierAddr = taskArgs.verifier;
    } else if (hasDeployedAddresses(chainId)) {
      verifierAddr = getVerifierAddress(chainId);
      console.log(
        `Verifier auto-resolved from deployed_addresses.json (chain ${chainId})`,
      );
    } else {
      throw new Error(
        "No --verifier provided and no deployed_addresses.json found. Specify --verifier explicitly.",
      );
    }

    const verifier = await hre.ethers.getContractAt(
      "IGroth16Verifier",
      verifierAddr,
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

    console.log("Verifier:", verifierAddr);
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
