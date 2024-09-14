"use client";

import { Button } from "@/components/ui/button";
import { useWalletInfo } from "@web3modal/wagmi/react";
import { LogOutIcon } from "lucide-react";
import { useDisconnect } from "wagmi";

export default function LandingPage() {
  const { walletInfo } = useWalletInfo();
  const { disconnect } = useDisconnect();

  console.log(walletInfo);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900 text-white p-4">
      <div className="max-w-3xl text-center">
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
          Smart Contract UI Generator
        </h1>
        <p className="text-xl mb-8 text-purple-200">
          Create beautiful and functional user interfaces for your smart
          contracts with just a few clicks. No coding required.
        </p>
        <div className="flex items-center justify-center w-full">
          <w3m-button
            balance="hide"
            size="md"
            label="Sign in 🚀"
            loadingLabel="Signing in ⏳"
          />
          {walletInfo && (
            <Button
              className="w-10 h-10 p-0 rounded-full"
              onClick={() => disconnect()}
            >
              <LogOutIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
