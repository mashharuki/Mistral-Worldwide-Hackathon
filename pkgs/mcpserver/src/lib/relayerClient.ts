import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";

const relayerKey = process.env.RELAYER_PRIVATE_KEY;

const account = relayerKey
  ? privateKeyToAccount(relayerKey as `0x${string}`)
  : undefined;

export const relayerClient = account
  ? createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(rpcUrl),
    })
  : null;
