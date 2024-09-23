// config/index.tsx

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

import { cookieStorage, createStorage } from "wagmi";
import { base, polygon, gnosis, celo, arbitrum } from "@reown/appkit/networks";
import { NETWORKS } from "@/constants/networks";

// Your WalletConnect Cloud project ID
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set");
}

// Create wagmiConfig
export const networks = [
  { ...base, rpc: NETWORKS["8453"].rpcUrl },
  { ...polygon, rpc: NETWORKS["137"].rpcUrl },
  { ...gnosis, rpc: NETWORKS["100"].rpcUrl },
  { ...celo, rpc: NETWORKS["42220"].rpcUrl },
  { ...arbitrum, rpc: NETWORKS["42161"].rpcUrl },
];
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  //   ...wagmiOptions, // Optional - Override createConfig parameters
});
