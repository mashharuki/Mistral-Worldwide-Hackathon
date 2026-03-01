import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getWalletProxyAddress,
  hasDeployedAddresses,
} from "../../helpers/contractJsonHelper";

/**
 * 【Task】Add deposit to EntryPoint for VoiceWallet
 */
task("walletAddDeposit", "Add ETH deposit to EntryPoint for VoiceWallet")
  .addOptionalParam(
    "wallet",
    "VoiceWallet proxy address",
    undefined,
    types.string,
  )
  .addParam("amount", "Amount in ETH to deposit (e.g. '0.01')")
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
