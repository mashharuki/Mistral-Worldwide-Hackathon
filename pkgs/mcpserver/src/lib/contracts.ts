/**
 * Base Sepolia 上のデプロイ済みコントラクトアドレスと ABI フラグメント
 */

// --- デプロイ済みアドレス ---
export const VOICE_WALLET_FACTORY_ADDRESS =
  (process.env.VOICE_WALLET_FACTORY_ADDRESS ??
    "0x3872A516c8e8FDB29b5D28C6D5528153D66Edd4f") as `0x${string}`;

export const VOICE_OWNERSHIP_VERIFIER_ADDRESS =
  (process.env.VOICE_OWNERSHIP_VERIFIER_ADDRESS ??
    "0x877e07ddC0b95640cD009154ab9dA6a691Ee783b") as `0x${string}`;

// EntryPoint v0.7
export const ENTRYPOINT_ADDRESS =
  "0x0000000071727De22E5E9d8BAf0edAc6f37da032" as `0x${string}`;

// MockERC20 (USDC) on Base Sepolia
export const USDC_ADDRESS =
  (process.env.USDC_ADDRESS ??
    "0x6aec1F4fddaa5c3dD559d884ED4905aE108d5Caa") as `0x${string}`;

// --- ABI フラグメント ---
export const voiceWalletFactoryAbi = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "verifier", type: "address" },
      {
        internalType: "bytes32",
        name: "voiceCommitment",
        type: "bytes32",
      },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
    ],
    name: "getAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "verifier", type: "address" },
      {
        internalType: "bytes32",
        name: "voiceCommitment",
        type: "bytes32",
      },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
    ],
    name: "createWallet",
    outputs: [{ internalType: "address", name: "wallet", type: "address" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// VoiceWallet ABI (execute functions)
export const voiceWalletAbi = [
  {
    inputs: [
      { internalType: "address", name: "dest", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "bytes", name: "func", type: "bytes" },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ERC-20 ABI fragments
export const erc20Abi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// EntryPoint v0.7 ABI fragments
export const entryPointAbi = [
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "sender", type: "address" },
          { internalType: "uint256", name: "nonce", type: "uint256" },
          { internalType: "bytes", name: "initCode", type: "bytes" },
          { internalType: "bytes", name: "callData", type: "bytes" },
          {
            internalType: "bytes32",
            name: "accountGasLimits",
            type: "bytes32",
          },
          {
            internalType: "uint256",
            name: "preVerificationGas",
            type: "uint256",
          },
          { internalType: "bytes32", name: "gasFees", type: "bytes32" },
          {
            internalType: "bytes",
            name: "paymasterAndData",
            type: "bytes",
          },
          { internalType: "bytes", name: "signature", type: "bytes" },
        ],
        internalType: "struct PackedUserOperation[]",
        name: "ops",
        type: "tuple[]",
      },
      {
        internalType: "address payable",
        name: "beneficiary",
        type: "address",
      },
    ],
    name: "handleOps",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "uint192", name: "key", type: "uint192" },
    ],
    name: "getNonce",
    outputs: [{ internalType: "uint256", name: "nonce", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
