// config/index.tsx

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

import { cookieStorage, createStorage } from "wagmi";
import {
  base as baseWagmi,
  polygon as polygonWagmi,
  gnosis as gnosisWagmi,
  celo as celoWagmi,
  arbitrum as arbitrumWagmi,
} from "wagmi/chains";
import { base, polygon, gnosis, celo, arbitrum } from "@reown/appkit/networks";
import { NETWORKS } from "@/constants/networks";
import { Chain, http } from "viem";

// Your WalletConnect Cloud project ID
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is not set");
}

// Create wagmiConfig
export const networks = [
  { ...base, rpcUrl: NETWORKS["8453"].rpcUrl },
  { ...polygon, rpcUrl: NETWORKS["137"].rpcUrl },
  { ...gnosis, rpcUrl: NETWORKS["100"].rpcUrl },
  { ...celo, rpcUrl: NETWORKS["42220"].rpcUrl },
  { ...arbitrum, rpcUrl: NETWORKS["42161"].rpcUrl },
];

export const chains = [
  {
    ...baseWagmi,
    rpcUrls: {
      default: {
        http: [NETWORKS["8453"].rpcUrl],
        webSocket: [NETWORKS["8453"].wsRpcUrl],
      },
    },
  },
  {
    ...polygonWagmi,
    rpcUrls: {
      default: {
        http: [NETWORKS["137"].rpcUrl],
        webSocket: [NETWORKS["137"].wsRpcUrl],
      },
    },
  },
  {
    ...gnosisWagmi,
    rpcUrls: {
      default: {
        http: [NETWORKS["100"].rpcUrl],
        webSocket: [NETWORKS["100"].wsRpcUrl],
      },
    },
  },
  {
    ...celoWagmi,
    rpcUrls: {
      default: {
        http: [NETWORKS["42220"].rpcUrl],
        webSocket: [NETWORKS["42220"].wsRpcUrl],
      },
    },
  },
  {
    ...arbitrumWagmi,
    rpcUrls: {
      default: {
        http: [NETWORKS["42161"].rpcUrl],
        webSocket: [NETWORKS["42161"].wsRpcUrl],
      },
    },
  },
] as readonly [Chain, ...Chain[]];
console.log("chains", chains);
export const wagmiAdapter = new WagmiAdapter({
  chains,
  networks,
  transports: {
    "8453": http(NETWORKS["8453"].rpcUrl),
    "137": http(NETWORKS["137"].rpcUrl),
    "100": http(NETWORKS["100"].rpcUrl),
    "42220": http(NETWORKS["42220"].rpcUrl),
    "42161": http(NETWORKS["42161"].rpcUrl),
  },
  projectId,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  //   ...wagmiOptions, // Optional - Override createConfig parameters
});
