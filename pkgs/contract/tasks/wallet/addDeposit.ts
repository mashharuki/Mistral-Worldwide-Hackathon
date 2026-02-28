import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】Add deposit to EntryPoint for VoiceWallet
 */
task("walletAddDeposit", "Add ETH deposit to EntryPoint for VoiceWallet")
  .addParam("wallet", "VoiceWallet proxy address")
  .addParam("amount", "Amount in ETH to deposit (e.g. '0.01')")
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

    const depositBefore = await wallet.getDeposit();
    console.log(
      "Deposit Before:",
      hre.ethers.formatEther(depositBefore),
      "ETH",
    );

    const amountWei = hre.ethers.parseEther(taskArgs.amount);
    console.log(`Adding ${taskArgs.amount} ETH deposit...`);

    const tx = await wallet.addDeposit({ value: amountWei });
    const receipt = await tx.wait();
    console.log("Transaction Hash:", receipt?.hash);

    const depositAfter = await wallet.getDeposit();
    console.log("Deposit After:", hre.ethers.formatEther(depositAfter), "ETH");

    console.log(
      "################################### [END] ###################################",
    );
  });
