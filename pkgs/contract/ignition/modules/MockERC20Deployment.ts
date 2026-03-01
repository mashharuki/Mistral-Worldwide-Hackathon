import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MockERC20DeploymentModule = buildModule("MockERC20Deployment", (m) => {
  const mockERC20 = m.contract("MockERC20");

  return { mockERC20 };
});

export default MockERC20DeploymentModule;
