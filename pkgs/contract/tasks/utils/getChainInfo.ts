import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】	getChainInfo of connected chain
 */
task("getChainInfo", "getChainInfo of connected chain").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const network = await hre.ethers.provider.getNetwork();
    const chainId = network.chainId;
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    const block = await hre.ethers.provider.getBlock(blockNumber);
    const count = block?.transactions.length ?? 0;
    const gasPrice = await hre.ethers.provider.getFeeData();
    const gasPriceInEther = hre.ethers.formatEther(gasPrice.gasPrice ?? 0n);

    console.log(`
      Chain ID: ${chainId}
      Block Number: ${blockNumber}
      Transaction Count: ${count}
      Gas Price: ${gasPriceInEther} ETH
    `);

    console.log(
      "################################### [END] ###################################",
    );
  },
);
