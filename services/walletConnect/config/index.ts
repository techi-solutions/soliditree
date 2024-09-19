// config/index.tsx

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

import { cookieStorage, createStorage } from "wagmi";
import {
  mainnet,
  base,
  polygon,
  optimism,
  gnosis,
  celo,
} from "@reown/appkit/networks";

// Your WalletConnect Cloud project ID
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set");
}

// Create wagmiConfig
export const networks = [mainnet, polygon, base, optimism, gnosis, celo];
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  //   ...wagmiOptions, // Optional - Override createConfig parameters
});
