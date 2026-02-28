import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】Execute ETH transfer from VoiceWallet
 */
task("walletEthTransfer", "Send ETH from VoiceWallet")
  .addParam("wallet", "VoiceWallet proxy address")
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount in ETH (e.g. '0.01')")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const [signer] = await hre.ethers.getSigners();
    console.log("Signer:", signer.address);

    const wallet = await hre.ethers.getContractAt(
      "VoiceWallet",
      taskArgs.wallet,
      signer,
    );

    const amountWei = hre.ethers.parseEther(taskArgs.amount);
    console.log(`Transferring ${taskArgs.amount} ETH to ${taskArgs.to}...`);

    const tx = await wallet.executeEthTransfer(taskArgs.to, amountWei);
    const receipt = await tx.wait();
    console.log("Transaction Hash:", receipt?.hash);

    console.log(
      "################################### [END] ###################################",
    );
  });
