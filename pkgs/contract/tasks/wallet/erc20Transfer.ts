import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getMockERC20Address,
  getWalletProxyAddress,
  hasDeployedAddresses,
} from "../../helpers/contractJsonHelper";

/**
 * 【Task】Execute ERC20 transfer from VoiceWallet
 */
task("walletErc20Transfer", "Send ERC20 tokens from VoiceWallet")
  .addOptionalParam(
    "wallet",
    "VoiceWallet proxy address",
    undefined,
    types.string,
  )
  .addOptionalParam(
    "token",
    "ERC20 token contract address",
    undefined,
    types.string,
  )
  .addParam("to", "Recipient address")
  .addParam("amount", "Amount in token units (e.g. '100.0')")
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
    const tokenAddress =
      taskArgs.token ??
      (hasDeployedAddresses(chainId)
        ? getMockERC20Address(chainId)
        : undefined);
    if (!tokenAddress) {
      throw new Error(
        "token address is required. Pass --token or deploy MockERC20 first.",
      );
    }

    const wallet = await hre.ethers.getContractAt(
      "VoiceWallet",
      walletAddress,
      signer,
    );

    const amountWei = hre.ethers.parseEther(taskArgs.amount);
    console.log(
      `Transferring ${taskArgs.amount} tokens from wallet to ${taskArgs.to}...`,
    );
    console.log("Wallet:", walletAddress);
    console.log("Token:", tokenAddress);

    const tx = await wallet.executeERC20Transfer(
      tokenAddress,
      taskArgs.to,
      amountWei,
    );
    const receipt = await tx.wait();
    console.log("Transaction Hash:", receipt?.hash);

    // Check balances after transfer
    const tokenContract = await hre.ethers.getContractAt(
      "MockERC20",
      tokenAddress,
    );
    const walletBalance = await tokenContract.balanceOf(walletAddress);
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
