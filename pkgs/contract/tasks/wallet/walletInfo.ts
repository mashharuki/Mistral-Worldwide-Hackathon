import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getWalletProxyAddress,
  hasDeployedAddresses,
} from "../../helpers/contractJsonHelper";

/**
 * 【Task】Get VoiceWallet state information
 */
task(
  "walletInfo",
  "Get VoiceWallet info (owner, verifier, commitment, deposit)",
)
  .addOptionalParam(
    "wallet",
    "VoiceWallet proxy address",
    undefined,
    types.string,
  )
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );
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

    const wallet = await hre.ethers.getContractAt("VoiceWallet", walletAddress);

    const owner = await wallet.owner();
    const verifier = await wallet.verifier();
    const commitment = await wallet.voiceCommitment();
    const entryPoint = await wallet.entryPoint();
    const deposit = await wallet.getDeposit();

    const ethBalance = await hre.ethers.provider.getBalance(walletAddress);

    console.log("Wallet Address:", walletAddress);
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
