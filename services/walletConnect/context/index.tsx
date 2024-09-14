// context/index.tsx

"use client";

import React, { ReactNode } from "react";
import { config, projectId } from "@/services/walletConnect/config";

import { createWeb3Modal } from "@web3modal/wagmi/react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { State, WagmiProvider } from "wagmi";

// Setup queryClient
const queryClient = new QueryClient();

if (!projectId) throw new Error("Project ID is not defined");

// Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableSwaps: false,
  enableAnalytics: false,
  enableOnramp: false,
  themeMode: "dark",
  themeVariables: {
    // "--w3m-font-family": "var(--font-geist-sans)",
    // "--w3m-accent": "#000000",
    "--w3m-border-radius-master": "0.5rem",
    "--w3m-font-size-master": "1rem",
  },
});

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
