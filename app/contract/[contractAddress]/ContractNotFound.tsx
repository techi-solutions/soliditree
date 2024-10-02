"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Network } from "@/constants/networks";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { chains } from "@/services/walletConnect/config";
import { useChainId } from "wagmi";

interface ContractNotFoundProps {
  chainId: number;
  contractAddress: string;
  network: Network;
}

export default function ContractNotFound({
  chainId,
  contractAddress,
  network,
}: ContractNotFoundProps) {
  const router = useRouter();

  const selectedChainId = useChainId();

  useEffect(() => {
    if (
      selectedChainId !== chainId &&
      chains.some((chain) => chain.id === selectedChainId)
    ) {
      router.replace(`/contract/${contractAddress}?chainId=${selectedChainId}`);
    }
  }, [selectedChainId, chainId, router, contractAddress]);

  return (
    <Card className="w-[350px] mx-auto mt-8">
      <CardHeader>
        <CardTitle>Contract Not Verified</CardTitle>
        <CardDescription>
          This contract is not verified on {network.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="chain" className="text-xl text-bold">
            Switch Network
          </Label>
          <Button className="rounded-full p-0 h-auto w-auto">
            <w3m-network-button />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
