import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】Deploy VoiceOwnershipVerifier or VoiceCommitmentVerifier
 */
task("deployVerifier", "Deploy a Groth16 verifier contract")
  .addOptionalParam(
    "type",
    "Verifier type: 'ownership' or 'commitment'",
    "ownership",
    types.string,
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const contractName =
      taskArgs.type === "commitment"
        ? "VoiceCommitmentVerifier"
        : "VoiceOwnershipVerifier";

    console.log(`Deploying ${contractName}...`);

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const Factory = await hre.ethers.getContractFactory(contractName);
    const verifier = await Factory.deploy();
    await verifier.waitForDeployment();

    const address = await verifier.getAddress();
    console.log(`${contractName} deployed at: ${address}`);

    console.log(
      "################################### [END] ###################################",
    );
  });
