import { polygon, base, gnosis, celo, arbitrum, Chain } from "viem/chains";

export const CHAINS: Record<string, Chain> = {
  "137": polygon,
  "8453": base,
  "100": gnosis,
  "42220": celo,
  "42161": arbitrum,
};
