import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】Withdraw deposit from EntryPoint for VoiceWallet
 */
task(
  "walletWithdrawDeposit",
  "Withdraw ETH deposit from EntryPoint for VoiceWallet",
)
  .addParam("wallet", "VoiceWallet proxy address")
  .addParam("to", "Withdrawal recipient address")
  .addParam("amount", "Amount in ETH to withdraw (e.g. '0.01')")
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
    console.log(`Withdrawing ${taskArgs.amount} ETH to ${taskArgs.to}...`);

    const tx = await wallet.withdrawDepositTo(taskArgs.to, amountWei);
    const receipt = await tx.wait();
    console.log("Transaction Hash:", receipt?.hash);

    const depositAfter = await wallet.getDeposit();
    console.log("Deposit After:", hre.ethers.formatEther(depositAfter), "ETH");

    console.log(
      "################################### [END] ###################################",
    );
  });
