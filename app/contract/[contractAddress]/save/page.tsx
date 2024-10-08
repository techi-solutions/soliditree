import { Suspense } from "react";
import Container from "./container";
import IPFSService from "@/services/ipfs";
import { ContractPage, ContractPageColors } from "@/services/contractPages";
import { NETWORKS } from "@/constants/networks";
import { CHAINS } from "@/constants/chains";
import { ExtendedAbi, ScanService } from "@/services/scan";
import { ProxyContractService } from "@/services/proxyContract";

export default async function NewContractPage({
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

  const createPage = async (
    data: FormData,
    functions: ExtendedAbi,
    colors: ContractPageColors
  ) => {
    "use server";

    if (functions.length === 0) {
      throw new Error("No functions selected");
    }

    const ipfsService = new IPFSService(
      process.env.IPFS_URL as string,
      process.env.IPFS_API_KEY as string
    );

    const icon = data.get("icon") as File | undefined;
    const backgroundImage = data.get("backgroundImage") as File | undefined;

    const uploadData: ContractPage = {
      chainId: Number(searchParams.chainId),
      contractAddress: params.contractAddress,
      title: data.get("title") as string,
      description: data.get("description") as string,
      website: data.get("website") as string,
      icon: process.env.DEFAULT_ICON as string,
      colors: colors,
      functions,
    };

    if (icon) {
      const iconHash = await ipfsService.uploadFile(icon);
      uploadData.icon = `ipfs://${iconHash}`;
    }

    if (backgroundImage) {
      const backgroundImageHash = await ipfsService.uploadFile(backgroundImage);
      uploadData.backgroundImage = `ipfs://${backgroundImageHash}`;
    }

    const hash = await ipfsService.uploadJSON(
      uploadData as unknown as Record<string, unknown>
    );
    console.log("hash", hash);
    return hash;
  };

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, abi] = await scan.getContractABI();

  const exists = abi.length > 0;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <meta name="theme-color" content="#0f766e" />
      <Container
        chainId={chain.id}
        network={network}
        contractAddress={params.contractAddress}
        exists={exists}
        abi={abi}
        createPage={createPage}
      />
    </Suspense>
  );
}
