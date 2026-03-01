import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";

const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL ?? "https://sepolia.base.org";

export const viemClient = createPublicClient({
  chain: baseSepolia,
  transport: http(rpcUrl),
});
