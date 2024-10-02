import { Suspense } from "react";
import Container from "@/components/Contract";
import { ContractPage } from "@/services/contractPages";
import { NETWORKS } from "@/constants/networks";
import { CHAINS } from "@/constants/chains";
import { ScanService } from "@/services/scan";
import { ProxyContractService } from "@/services/proxyContract";
import ContractNotFound from "./ContractNotFound";

export default async function Page({
  params,
  searchParams,
}: {
  params: { contractAddress: string };
  searchParams: { chainId?: string };
}) {
  const chainId: number | undefined = searchParams.chainId
    ? Number(searchParams.chainId)
    : undefined;

  const network = chainId ? NETWORKS[chainId] : NETWORKS["8453"];
  if (!network) {
    return <div>Network not found</div>;
  }

  const chain = chainId ? CHAINS[chainId] : CHAINS["8453"];

  const apiKey = process.env[`${network.name.toUpperCase()}_ETHERSCAN_API_KEY`];

  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY is not set");
  }

  const proxyContractService = new ProxyContractService(
    network.rpcUrl,
    params.contractAddress,
    chain
  );

  const scan = new ScanService(
    apiKey,
    network.explorerApi,
    proxyContractService
  );

  const abi = await scan.getContractABI();

  const details = await scan.getContractDetails(params.contractAddress);
  console.log(details);
  if (!details) {
    return (
      <ContractNotFound
        chainId={chain.id}
        contractAddress={params.contractAddress}
        network={network}
      />
    );
  }

  const contractPage: ContractPage = {
    chainId: chain.id,
    contractAddress: params.contractAddress,
    title: details.ContractName,
    description: `Published to ${network.name}`,
    icon: process.env.DEFAULT_ICON as string,
    functions: abi,
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <meta name="theme-color" content="#0f766e" />
      <Container
        explore
        pageId={params.contractAddress}
        network={network}
        contractData={contractPage}
      />
    </Suspense>
  );
}
