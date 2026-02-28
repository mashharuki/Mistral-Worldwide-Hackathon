import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const DEFAULT_ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

/**
 * 【Task】Deploy VoiceWallet implementation + ERC1967Proxy and initialize
 */
task("deployVoiceWallet", "Deploy VoiceWallet with proxy and initialize")
  .addParam("verifier", "Address of the Groth16 verifier contract")
  .addParam("commitment", "Voice commitment hash (bytes32)")
  .addOptionalParam(
    "entrypoint",
    "ERC-4337 EntryPoint address",
    DEFAULT_ENTRY_POINT,
    types.string,
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("EntryPoint:", taskArgs.entrypoint);
    console.log("Verifier:", taskArgs.verifier);
    console.log("Commitment:", taskArgs.commitment);

    // 1. Deploy VoiceWallet implementation
    console.log("\n--- Deploying VoiceWallet implementation ---");
    const VoiceWallet = await hre.ethers.getContractFactory("VoiceWallet");
    const implementation = await VoiceWallet.deploy(taskArgs.entrypoint);
    await implementation.waitForDeployment();
    const implAddress = await implementation.getAddress();
    console.log("Implementation deployed at:", implAddress);

    // 2. Encode initialize calldata
    const initData = implementation.interface.encodeFunctionData("initialize", [
      deployer.address,
      taskArgs.entrypoint,
      taskArgs.verifier,
      taskArgs.commitment,
    ]);

    // 3. Deploy ERC1967Proxy
    console.log("\n--- Deploying ERC1967Proxy ---");
    const Proxy = await hre.ethers.getContractFactory("TestERC1967Proxy");
    const proxy = await Proxy.deploy(implAddress, initData);
    await proxy.waitForDeployment();
    const proxyAddress = await proxy.getAddress();
    console.log("Proxy deployed at:", proxyAddress);

    // 4. Verify initialization
    const wallet = await hre.ethers.getContractAt("VoiceWallet", proxyAddress);
    const owner = await wallet.owner();
    const verifier = await wallet.verifier();
    const commitment = await wallet.voiceCommitment();

    console.log("\n--- Wallet State ---");
    console.log("Owner:", owner);
    console.log("Verifier:", verifier);
    console.log("Voice Commitment:", commitment);

    console.log(
      "################################### [END] ###################################",
    );
  });
