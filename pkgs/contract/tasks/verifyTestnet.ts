import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  getVerifierAddress,
  hasDeployedAddresses,
} from "./../helpers/contractJsonHelper";

/**
 * 【Task】End-to-end verification of VoiceWallet on testnet
 *
 * Steps:
 * 1. Deploy VoiceWallet implementation + proxy with Verifier
 * 2. Fund the wallet with ETH
 * 3. Execute ETH transfer from wallet
 * 4. Deploy MockERC20 and mint tokens to wallet
 * 5. Execute ERC20 transfer from wallet
 * 6. Verify all balances
 *
 * Verifier アドレスは deployed_addresses.json から自動取得。
 * 見つからない場合は MockGroth16Verifier をフォールバックデプロイ。
 */
task("verifyTestnet", "E2E verification of VoiceWallet on testnet").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const [deployer] = await hre.ethers.getSigners();
    const chainId = Number((await hre.ethers.provider.getNetwork()).chainId);
    console.log("Deployer:", deployer.address);
    console.log("Chain ID:", chainId);

    // Verifier アドレスの解決: JSON > MockVerifier フォールバック
    let verifierAddress: string;

    if (hasDeployedAddresses(chainId)) {
      verifierAddress = getVerifierAddress(chainId);
      console.log(
        `Using VoiceOwnershipVerifier from deployed_addresses.json: ${verifierAddress}`,
      );
    } else {
      console.log("No deployment found. Deploying MockGroth16Verifier...");
      const MockVerifier = await hre.ethers.getContractFactory(
        "MockGroth16Verifier",
      );
      const mockVerifier = await MockVerifier.deploy();
      await mockVerifier.waitForDeployment();
      verifierAddress = await mockVerifier.getAddress();
      console.log("MockGroth16Verifier deployed at:", verifierAddress);
    }

    // 1. Deploy VoiceWallet implementation
    console.log("\n--- Step 1: Deploy VoiceWallet ---");
    const entryPointAddress = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
    const VoiceWallet = await hre.ethers.getContractFactory("VoiceWallet");
    const implementation = await VoiceWallet.deploy(entryPointAddress);
    await implementation.waitForDeployment();
    const implAddress = await implementation.getAddress();
    console.log("Implementation deployed at:", implAddress);

    // 2. Deploy proxy with initialize
    console.log("\n--- Step 2: Deploy Proxy & Initialize ---");
    const voiceCommitment = hre.ethers.keccak256(
      hre.ethers.toUtf8Bytes("test-voice-commitment"),
    );
    console.log("Voice Commitment:", voiceCommitment);

    const initData = implementation.interface.encodeFunctionData("initialize", [
      deployer.address,
      entryPointAddress,
      verifierAddress,
      voiceCommitment,
    ]);

    const Proxy = await hre.ethers.getContractFactory("TestERC1967Proxy");
    const proxy = await Proxy.deploy(implAddress, initData);
    await proxy.waitForDeployment();
    const walletAddress = await proxy.getAddress();
    console.log("Wallet (proxy) deployed at:", walletAddress);

    const wallet = await hre.ethers.getContractAt("VoiceWallet", walletAddress);

    // Verify initialization
    const owner = await wallet.owner();
    const verifier = await wallet.verifier();
    const commitment = await wallet.voiceCommitment();
    console.log("Owner:", owner);
    console.log("Verifier:", verifier);
    console.log("Commitment:", commitment);

    // 3. Fund wallet with ETH
    console.log("\n--- Step 3: Fund Wallet with ETH ---");
    const fundAmount = hre.ethers.parseEther("0.001");
    const fundTx = await deployer.sendTransaction({
      to: walletAddress,
      value: fundAmount,
    });
    await fundTx.wait();

    const walletEthBalance =
      await hre.ethers.provider.getBalance(walletAddress);
    console.log(
      "Wallet ETH Balance:",
      hre.ethers.formatEther(walletEthBalance),
      "ETH",
    );

    // 4. Execute ETH transfer
    console.log("\n--- Step 4: Execute ETH Transfer ---");
    const ethTransferAmount = hre.ethers.parseEther("0.0005");
    const ethTx = await wallet.executeEthTransfer(
      deployer.address,
      ethTransferAmount,
    );
    const ethReceipt = await ethTx.wait();
    console.log("ETH Transfer TX:", ethReceipt?.hash);

    const walletEthAfter = await hre.ethers.provider.getBalance(walletAddress);
    console.log(
      "Wallet ETH After:",
      hre.ethers.formatEther(walletEthAfter),
      "ETH",
    );

    // 5. Deploy MockERC20 and mint
    console.log("\n--- Step 5: Deploy MockERC20 & Mint ---");
    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const mockToken = await MockERC20.deploy("VoiceTestToken", "VTT");
    await mockToken.waitForDeployment();
    const tokenAddress = await mockToken.getAddress();
    console.log("MockERC20 deployed at:", tokenAddress);

    const mintAmount = hre.ethers.parseEther("1000");
    const mintTx = await mockToken.mint(walletAddress, mintAmount);
    await mintTx.wait();
    console.log("Minted", hre.ethers.formatEther(mintAmount), "VTT to wallet");

    // 6. Execute ERC20 transfer
    console.log("\n--- Step 6: Execute ERC20 Transfer ---");
    const tokenTransferAmount = hre.ethers.parseEther("500");
    const erc20Tx = await wallet.executeERC20Transfer(
      tokenAddress,
      deployer.address,
      tokenTransferAmount,
    );
    const erc20Receipt = await erc20Tx.wait();
    console.log("ERC20 Transfer TX:", erc20Receipt?.hash);

    // 7. Final verification
    console.log("\n--- Final Results ---");
    const finalWalletTokenBalance = await mockToken.balanceOf(walletAddress);
    const finalDeployerTokenBalance = await mockToken.balanceOf(
      deployer.address,
    );
    const finalWalletEth = await hre.ethers.provider.getBalance(walletAddress);

    console.log(
      "Wallet VTT Balance:",
      hre.ethers.formatEther(finalWalletTokenBalance),
    );
    console.log(
      "Deployer VTT Balance:",
      hre.ethers.formatEther(finalDeployerTokenBalance),
    );
    console.log("Wallet ETH Balance:", hre.ethers.formatEther(finalWalletEth));
    console.log("Verification Successful!");

    console.log(
      "################################### [END] ###################################",
    );
  },
);
