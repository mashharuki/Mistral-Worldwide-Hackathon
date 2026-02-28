import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import VoiceWalletDeploymentModule from "./VoiceWalletDeployment";

/**
 * VoiceWallet 実装 + ERC1967Proxy をデプロイし initialize を実行するモジュール。
 *
 * VoiceWalletDeployment でデプロイ済みの VoiceOwnershipVerifier を自動参照する。
 * パラメータ:
 *   - owner:       ウォレットオーナーアドレス（必須）
 *   - commitment:  声コミットメント bytes32（必須）
 *   - entryPoint:  ERC-4337 EntryPoint（デフォルト: v0.7）
 */
const VoiceWalletProxyDeploymentModule = buildModule(
  "VoiceWalletProxyDeployment",
  (m) => {
    const entryPoint = m.getParameter(
      "entryPoint",
      "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
    );
    const owner = m.getParameter<string>("owner");
    const commitment = m.getParameter<string>("commitment");

    // VoiceWalletDeployment モジュールから Verifier を参照（未デプロイなら自動デプロイ）
    const { groth16Verifier } = m.useModule(VoiceWalletDeploymentModule);

    // VoiceWallet 実装コントラクト
    const voiceWalletImpl = m.contract("VoiceWallet", [entryPoint]);

    // initialize calldata をエンコード
    const initCall = m.encodeFunctionCall(
      voiceWalletImpl,
      "initialize(address,address,address,bytes32)",
      [owner, entryPoint, groth16Verifier, commitment],
    );

    // ERC1967Proxy をデプロイ（initialize 込み）
    const proxy = m.contract("TestERC1967Proxy", [voiceWalletImpl, initCall]);

    return { voiceWalletImpl, proxy };
  },
);

export default VoiceWalletProxyDeploymentModule;
