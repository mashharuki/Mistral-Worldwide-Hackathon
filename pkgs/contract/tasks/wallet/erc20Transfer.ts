import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】Execute ERC20 transfer from VoiceWallet
 */
task("walletErc20Transfer", "Send ERC20 tokens from VoiceWallet")
  .addParam("wallet", "VoiceWallet proxy address")
  .addParam("token", "ERC20 token contract address")
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount in token units (e.g. '100.0')")
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
    console.log(
      `Transferring ${taskArgs.amount} tokens from wallet to ${taskArgs.to}...`,
    );
    console.log("Token:", taskArgs.token);

    const tx = await wallet.executeERC20Transfer(
      taskArgs.token,
      taskArgs.to,
      amountWei,
    );
    const receipt = await tx.wait();
    console.log("Transaction Hash:", receipt?.hash);

    // Check balances after transfer
    const tokenContract = await hre.ethers.getContractAt(
      "MockERC20",
      taskArgs.token,
    );
    const walletBalance = await tokenContract.balanceOf(taskArgs.wallet);
    const recipientBalance = await tokenContract.balanceOf(taskArgs.to);
    console.log("Wallet Token Balance:", hre.ethers.formatEther(walletBalance));
    console.log(
      "Recipient Token Balance:",
      hre.ethers.formatEther(recipientBalance),
    );

    console.log(
      "################################### [END] ###################################",
    );
  });
