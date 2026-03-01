import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getWalletProxyAddress,
  hasDeployedAddresses,
} from "../../helpers/contractJsonHelper";

/**
 * 【Task】Withdraw deposit from EntryPoint for VoiceWallet
 */
task(
  "walletWithdrawDeposit",
  "Withdraw ETH deposit from EntryPoint for VoiceWallet",
)
  .addOptionalParam(
    "wallet",
    "VoiceWallet proxy address",
    undefined,
    types.string,
  )
  .addParam("to", "Withdrawal recipient address")
  .addParam("amount", "Amount in ETH to withdraw (e.g. '0.01')")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const [signer] = await hre.ethers.getSigners();
    console.log("Signer:", signer.address);
    const network = await hre.ethers.provider.getNetwork();
    const chainId = Number(network.chainId);
    const walletAddress =
      taskArgs.wallet ??
      (hasDeployedAddresses(chainId)
        ? getWalletProxyAddress(chainId)
        : undefined);
    if (!walletAddress) {
      throw new Error(
        "wallet address is required. Pass --wallet or deploy contracts first.",
      );
    }

    const wallet = await hre.ethers.getContractAt(
      "VoiceWallet",
      walletAddress,
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
