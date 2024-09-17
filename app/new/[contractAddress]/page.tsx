import { Suspense } from "react";
import NewContractPageContainer from "@/containers/NewContractPage";
import IPFSService from "@/services/ipfs";
import { ContractPage } from "@/services/contractPages";
import { NETWORKS } from "@/constants/networks";
import { CHAINS } from "@/constants/chains";
import { ExtendedAbi, ScanService } from "@/services/scan";
import { ProxyContractService } from "@/services/proxyContract";

export default async function NewContractPage({
  params,
  searchParams,
}: {
  params: { contractAddress: string };
  searchParams: { chainId: string };
}) {
  const chainId = Number(searchParams.chainId);

  const network = NETWORKS[chainId];

  const chain = CHAINS[chainId];

  const apiKey = process.env[`${network.name.toUpperCase()}_ETHERSCAN_API_KEY`];

  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY is not set");
  }

  const createPage = async (data: FormData, functions: ExtendedAbi) => {
    "use server";

    if (functions.length === 0) {
      throw new Error("No functions selected");
    }

    const ipfsService = new IPFSService(
      process.env.IPFS_URL as string,
      process.env.IPFS_API_KEY as string
    );

    console.log(data);
    const icon = data.get("icon") as File | undefined;

    const uploadData: ContractPage = {
      chainId: Number(searchParams.chainId),
      contractAddress: params.contractAddress,
      title: data.get("title") as string,
      description: data.get("description") as string,
      website: data.get("website") as string,
      icon: process.env.DEFAULT_ICON as string,
      functions,
    };

    if (icon) {
      const iconHash = await ipfsService.uploadFile(icon);
      console.log("iconHash", iconHash);
      uploadData.icon = `ipfs://${iconHash}`;
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

  const abi = await scan.getContractABI();

  const exists = abi.length > 0;

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewContractPageContainer
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
