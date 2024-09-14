// config/index.tsx

import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";

import { cookieStorage, createStorage } from "wagmi";
import { mainnet, base, polygon, optimism, gnosis, celo } from "wagmi/chains";

// Your WalletConnect Cloud project ID
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set");
}

// Create a metadata object
const metadata = {
  name: "dInterface",
  description: "An interface for your smart contracts",
  url: "https://dinterface.xyz", // origin must match your domain & subdomain
  icons: ["https://dinterface.xyz/favicon.ico"],
};

// Create wagmiConfig
const chains = [mainnet, polygon, base, optimism, gnosis, celo] as const;
export const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  //   ...wagmiOptions, // Optional - Override createConfig parameters
});
