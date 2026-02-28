import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】Get VoiceWallet state information
 */
task(
  "walletInfo",
  "Get VoiceWallet info (owner, verifier, commitment, deposit)",
)
  .addParam("wallet", "VoiceWallet proxy address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const wallet = await hre.ethers.getContractAt(
      "VoiceWallet",
      taskArgs.wallet,
    );

    const owner = await wallet.owner();
    const verifier = await wallet.verifier();
    const commitment = await wallet.voiceCommitment();
    const entryPoint = await wallet.entryPoint();
    const deposit = await wallet.getDeposit();

    const ethBalance = await hre.ethers.provider.getBalance(taskArgs.wallet);

    console.log("Wallet Address:", taskArgs.wallet);
    console.log("Owner:", owner);
    console.log("Verifier:", verifier);
    console.log("Voice Commitment:", commitment);
    console.log("EntryPoint:", entryPoint);
    console.log("EntryPoint Deposit:", hre.ethers.formatEther(deposit), "ETH");
    console.log("ETH Balance:", hre.ethers.formatEther(ethBalance), "ETH");

    console.log(
      "################################### [END] ###################################",
    );
  });
