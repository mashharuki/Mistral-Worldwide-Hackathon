import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getWalletProxyAddress,
  hasDeployedAddresses,
} from "../../helpers/contractJsonHelper";

/**
 * 【Task】Execute ETH transfer from VoiceWallet
 */
task("walletEthTransfer", "Send ETH from VoiceWallet")
  .addOptionalParam("wallet", "VoiceWallet proxy address", undefined, types.string)
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount in ETH (e.g. '0.01')")
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

    const amountWei = hre.ethers.parseEther(taskArgs.amount);
    console.log(`Transferring ${taskArgs.amount} ETH to ${taskArgs.to}...`);
    console.log("Wallet:", walletAddress);

    const tx = await wallet.executeEthTransfer(taskArgs.to, amountWei);
    const receipt = await tx.wait();
    console.log("Transaction Hash:", receipt?.hash);

    console.log(
      "################################### [END] ###################################",
    );
  });
