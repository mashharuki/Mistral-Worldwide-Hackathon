import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const VoiceCommitmentVerifierDeploymentModule = buildModule(
  "VoiceCommitmentVerifierDeployment",
  (m) => {
    const voiceCommitmentVerifier = m.contract("VoiceCommitmentVerifier");
    return { voiceCommitmentVerifier };
  },
);

export default VoiceCommitmentVerifierDeploymentModule;
