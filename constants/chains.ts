import {
  mainnet,
  polygon,
  base,
  optimism,
  gnosis,
  celo,
  Chain,
} from "viem/chains";

export const CHAINS: Record<string, Chain> = {
  "1": mainnet,
  "137": polygon,
  "8453": base,
  "10": optimism,
  "100": gnosis,
  "42220": celo,
};
