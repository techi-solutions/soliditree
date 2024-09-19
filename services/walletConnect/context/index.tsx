"use client";

import {
  wagmiAdapter,
  projectId,
  networks,
} from "@/services/walletConnect/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import React, { type ReactNode } from "react";
import { cookieToInitialState, WagmiProvider, type Config } from "wagmi";
import Favicon from "@/public/favicon.ico";

// Set up queryClient
const queryClient = new QueryClient();

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// Create a metadata object
const metadata = {
  name: "Soliditree",
  description: "An interface for your smart contracts",
  url: "https://soliditree.xyz", // origin must match your domain & subdomain
  icons: [Favicon.src],
};

// Create the modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks,
  defaultNetwork: networks[0],
  metadata: metadata,
  features: {
    analytics: false,
    swaps: false,
    onramp: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#489587",
    "--w3m-color-mix": "#00BB7F",
    "--w3m-color-mix-strength": 40,
  },
});

function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  const initialState = cookieToInitialState(
    wagmiAdapter.wagmiConfig as Config,
    cookies
  );

  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig as Config}
      initialState={initialState}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

export default ContextProvider;
