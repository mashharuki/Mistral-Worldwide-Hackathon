import * as fs from "node:fs";
import * as path from "node:path";

interface DeployedAddresses {
  [key: string]: string;
}

const IGNITION_DEPLOYMENTS_DIR = path.join(
  __dirname,
  "../ignition/deployments",
);

const CONTRACT_KEYS = {
  VoiceOwnershipVerifier: "VoiceWalletDeployment#VoiceOwnershipVerifier",
  VoiceWalletFactory: "VoiceWalletDeployment#VoiceWalletFactory",
  VoiceWalletProxy: "VoiceWalletProxyDeployment#TestERC1967Proxy",
  VoiceWalletImplementation: "VoiceWalletProxyDeployment#VoiceWallet",
  MockERC20: "MockERC20Deployment#MockERC20",
} as const;

/**
 * 指定チェーンの deployed_addresses.json を読み込む
 */
function loadDeployedAddresses(chainId: number): DeployedAddresses {
  const filePath = path.join(
    IGNITION_DEPLOYMENTS_DIR,
    `chain-${chainId}`,
    "deployed_addresses.json",
  );
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Deployed addresses not found for chain ${chainId} at ${filePath}`,
    );
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/**
 * deployed_addresses.json が存在するか確認する
 */
export function hasDeployedAddresses(chainId: number): boolean {
  const filePath = path.join(
    IGNITION_DEPLOYMENTS_DIR,
    `chain-${chainId}`,
    "deployed_addresses.json",
  );
  return fs.existsSync(filePath);
}

/**
 * VoiceOwnershipVerifier のデプロイ済みアドレスを取得する
 */
export function getVerifierAddress(chainId: number): string {
  const addresses = loadDeployedAddresses(chainId);
  const address = addresses[CONTRACT_KEYS.VoiceOwnershipVerifier];
  if (!address) {
    throw new Error(
      "VoiceOwnershipVerifier address not found in deployed_addresses.json",
    );
  }
  return address;
}

/**
 * VoiceWalletFactory のデプロイ済みアドレスを取得する
 */
export function getFactoryAddress(chainId: number): string {
  const addresses = loadDeployedAddresses(chainId);
  const address = addresses[CONTRACT_KEYS.VoiceWalletFactory];
  if (!address) {
    throw new Error(
      "VoiceWalletFactory address not found in deployed_addresses.json",
    );
  }
  return address;
}

/**
 * VoiceWallet Proxy（TestERC1967Proxy）のデプロイ済みアドレスを取得する
 * 互換性のため、Proxyキーがない場合は VoiceWallet キーをフォールバックする。
 */
export function getWalletProxyAddress(chainId: number): string {
  const addresses = loadDeployedAddresses(chainId);
  const address =
    addresses[CONTRACT_KEYS.VoiceWalletProxy] ??
    addresses[CONTRACT_KEYS.VoiceWalletImplementation];
  if (!address) {
    throw new Error(
      "VoiceWallet proxy address not found in deployed_addresses.json",
    );
  }
  return address;
}

/**
 * MockERC20 のデプロイ済みアドレスを取得する
 */
export function getMockERC20Address(chainId: number): string {
  const addresses = loadDeployedAddresses(chainId);
  const address = addresses[CONTRACT_KEYS.MockERC20];
  if (!address) {
    throw new Error("MockERC20 address not found in deployed_addresses.json");
  }
  return address;
}

/**
 * 全デプロイ済みアドレスを取得する
 */
export function getAllDeployedAddresses(chainId: number): DeployedAddresses {
  return loadDeployedAddresses(chainId);
}
