"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useDisconnect } from "wagmi";
import { LogOutIcon } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default function LandingPage() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();

  return (
    <div className="flex items-center justify-center min-h-screen text-white p-4">
      <div className="max-w-2xl text-center">
        <div className="mb-6 relative h-20 w-full">
          <Image
            src="/assets/logo.png"
            alt="Smart Contract UI Generator Logo"
            fill
            style={{ objectFit: "contain" }}
            priority
          />
        </div>
        <h1 className="text-5xl font-extrabold mb-6 tracking-tight">
          Soliditree
        </h1>
        <h2 className="text-2xl mb-6 tracking-tight">
          Smart Contract UI Generator
        </h2>
        <p className="text-xl mb-8">
          Create beautiful and functional user interfaces for your smart
          contracts with just a few clicks. No coding required.
        </p>
        <div className="animate-fade-in-slow flex items-center justify-center w-full font-color-white">
          <w3m-button
            disabled={!!address}
            balance="hide"
            size="md"
            label="Sign in 🚀"
            loadingLabel="Signing in ⏳"
          />
          {address && (
            <Button
              className="animate-fade-in w-10 h-10 p-0 rounded-full"
              onClick={() => disconnect()}
            >
              <LogOutIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
        {address && (
          <Separator className="my-8 animate-fade-in-slow bg-white" />
        )}
        {address && (
          <Link href="/manage">
            <Button className="mt-4 animate-fade-in">Manage Pages</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
