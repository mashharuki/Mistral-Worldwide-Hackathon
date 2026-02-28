import { task, types } from "hardhat/config";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

/**
 * 【Task】Deploy MockERC20 for testing
 */
task("deployMockERC20", "Deploy a MockERC20 token for testing")
  .addOptionalParam("name", "Token name", "Mock Token", types.string)
  .addOptionalParam("symbol", "Token symbol", "MCK", types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    console.log(
      "################################### [START] ###################################",
    );

    const [deployer] = await hre.ethers.getSigners();
    console.log("Deployer:", deployer.address);

    const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(taskArgs.name, taskArgs.symbol);
    await token.waitForDeployment();

    const address = await token.getAddress();
    console.log(
      `MockERC20 "${taskArgs.name}" (${taskArgs.symbol}) deployed at: ${address}`,
    );

    console.log(
      "################################### [END] ###################################",
    );
  });
