import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VoiceWalletDeploymentModule = buildModule("VoiceWalletDeployment", (m) => {
  const entryPoint = m.getParameter(
    "entryPoint",
    "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  );

  // Groth16 verifier first
  const groth16Verifier = m.contract("VoiceOwnershipVerifier");

  // Then factory wired with EntryPoint v0.7
  const voiceWalletFactory = m.contract("VoiceWalletFactory", [entryPoint]);

  return { groth16Verifier, voiceWalletFactory };
});

export default VoiceWalletDeploymentModule;
