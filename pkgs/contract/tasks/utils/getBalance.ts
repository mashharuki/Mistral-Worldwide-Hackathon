import { task } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】get the balance of the account
 */
task("getBalance", "getBalance").setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );
    const [owner] = await hre.ethers.getSigners();

    const ownerBalance = await hre.ethers.provider.getBalance(owner.address);

    console.log(
      `Balance of ${owner.address}: ${hre.ethers.formatEther(ownerBalance)} ETH`,
    );

    console.log(
      "################################### [END] ###################################",
    );
  },
);
