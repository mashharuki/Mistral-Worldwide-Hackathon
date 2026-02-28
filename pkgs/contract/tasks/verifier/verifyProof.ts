import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "node:fs";
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
  .addOptionalParam(
    "proof",
    "JSON string of proof: {a:[2], b:[[2],[2]], c:[2], input:[1]}",
    undefined,
    types.string,
  )
  .addOptionalParam(
    "proofFile",
    "Path to snarkjs proof json (e.g. pkgs/circuit/data/VoiceOwnership_proof.json)",
    undefined,
    types.string,
  )
  .addOptionalParam(
    "publicFile",
    "Path to snarkjs public json (e.g. pkgs/circuit/data/VoiceOwnership_public.json)",
    undefined,
    types.string,
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

    const defaultProofFile = "../circuit/data/VoiceOwnership_proof.json";
    const defaultPublicFile = "../circuit/data/VoiceOwnership_public.json";
    const proofArg =
      typeof taskArgs.proof === "string" ? taskArgs.proof.trim() : "";
    const proofFileArg =
      typeof taskArgs.proofFile === "string" ? taskArgs.proofFile : undefined;
    const publicFileArg =
      typeof taskArgs.publicFile === "string" ? taskArgs.publicFile : undefined;

    if (proofArg.length > 0) {
      try {
        proofData = JSON.parse(proofArg);
      } catch {
        throw new Error(
          'Invalid proof JSON. Expected: {"a":[...], "b":[[...],[...]], "c":[...], "input":[...]}',
        );
      }
    } else {
      const resolvedProofFile =
        proofFileArg ??
        (fs.existsSync(defaultProofFile) ? defaultProofFile : undefined);
      const resolvedPublicFile =
        publicFileArg ??
        (fs.existsSync(defaultPublicFile) ? defaultPublicFile : undefined);

      if (resolvedProofFile && resolvedPublicFile) {
        if (!fs.existsSync(resolvedProofFile)) {
          throw new Error(`proofFile not found: ${resolvedProofFile}`);
        }
        if (!fs.existsSync(resolvedPublicFile)) {
          throw new Error(`publicFile not found: ${resolvedPublicFile}`);
        }

        if (!proofFileArg && !publicFileArg) {
          console.log(
            `Proof files auto-resolved: ${resolvedProofFile}, ${resolvedPublicFile}`,
          );
        }

        const snarkProof = JSON.parse(
          fs.readFileSync(resolvedProofFile, "utf8"),
        );
        const snarkPublic = JSON.parse(
          fs.readFileSync(resolvedPublicFile, "utf8"),
        ) as string[];
        if (!Array.isArray(snarkPublic) || snarkPublic.length < 1) {
          throw new Error("publicFile must contain at least one public signal");
        }

        // snarkjs format -> verifier input format
        // NOTE:
        // snarkjs の pi_b は Solidity verifier が期待する順序と逆になるため、
        // 各ペアを [1], [0] の順で並べ替える。
        proofData = {
          a: [snarkProof.pi_a[0], snarkProof.pi_a[1]],
          b: [
            [snarkProof.pi_b[0][1], snarkProof.pi_b[0][0]],
            [snarkProof.pi_b[1][1], snarkProof.pi_b[1][0]],
          ],
          c: [snarkProof.pi_c[0], snarkProof.pi_c[1]],
          input: [snarkPublic[0]],
        };
      } else {
        throw new Error(
          "Provide either --proof OR both --proofFile and --publicFile.",
        );
      }
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
