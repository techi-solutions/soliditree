"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAccount, useDisconnect } from "wagmi";
import { LogOutIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LandingPageContainer() {
  const router = useRouter();
  const { address, chainId } = useAccount();
  const { disconnect } = useDisconnect();

  const [contractAddress, setContractAddress] = useState("");
  const [isValidContract, setIsValidContract] = useState(false);
  const [debouncedValidContract] = useDebounce(isValidContract, 300);

  const handleContractAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setContractAddress(e.target.value);
    setIsValidContract(true); // You might want to add actual validation here
  };

  const handleCreatePage = () => {
    router.push(`/contract/${contractAddress}?chainId=${chainId}`);
  };

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
          <div
            className={cn(
              "rounded-full overflow-hidden",
              address ? "bg-white py-1" : "bg-white p-1"
            )}
          >
            <w3m-button
              balance="hide"
              size="md"
              label="Sign in 🚀"
              loadingLabel="Signing in ⏳"
            />
          </div>
          {address && (
            <Button
              className="animate-fade-in w-10 h-10 p-0 rounded-full ml-2"
              onClick={() => disconnect()}
            >
              <LogOutIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
        {address && (
          <>
            <Separator className="my-8 animate-fade-in-slow bg-white" />
            <div className="mt-8 animate-fade-in-slow">
              <h3 className="text-2xl font-bold mb-4">Search for a contract</h3>
              <Input
                type="text"
                placeholder="Enter contract address"
                className="w-full text-lg"
                onChange={handleContractAddressChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreatePage();
                  }
                }}
                value={contractAddress}
              />
              {debouncedValidContract && (
                <Link href={`/contract/${contractAddress}?chainId=${chainId}`}>
                  <Button className="mt-4 animate-fade-in">
                    Search <SearchIcon className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
            </div>
            {/* <Separator className="my-8 animate-fade-in-slow bg-white" />
            <Link href="/manage">
              <Button className="mt-4 animate-fade-in">
                Manage Existing Pages
              </Button>
            </Link> */}
          </>
        )}
      </div>
    </div>
  );
}
