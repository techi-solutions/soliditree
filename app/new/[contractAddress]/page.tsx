import { Suspense } from "react";
import NewContractPageContainer from "@/containers/NewContractPage";
import IPFSService from "@/services/ipfs";
import { ContractPage, ContractPagesService } from "@/services/contractPages";
import { NETWORKS } from "@/constants/networks";
import { CHAINS } from "@/constants/chains";
import { ScanService } from "@/services/scan";
import { ProxyContractService } from "@/services/proxyContract";

async function createPage(data: FormData) {
  "use server";

  const ipfsService = new IPFSService(
    process.env.IPFS_URL as string,
    process.env.IPFS_API_KEY as string
  );

  console.log(data);
  const icon = data.get("icon") as File | undefined;

  const uploadData: ContractPage = {
    title: data.get("title") as string,
    description: data.get("description") as string,
    website: data.get("website") as string,
    functions: [],
  };

  if (!icon) {
    uploadData.icon = process.env.DEFAULT_ICON as string;
  } else {
    const iconHash = await ipfsService.uploadFile(icon);
    console.log("iconHash", iconHash);
    uploadData.icon = `ipfs://${iconHash}`;
  }
  const hash = await ipfsService.uploadJSON(
    uploadData as unknown as Record<string, unknown>
  );
  console.log("hash", hash);
  return hash;
}

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

  const contractPagesService = new ContractPagesService(
    network.rpcUrl,
    network.adminContractAddress,
    chain
  );

  const exists = await contractPagesService.contractExists();

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

  console.log("abi", abi);

  console.log("exists", exists);

  console.log("chainId", chainId);
  console.log("network", network);
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewContractPageContainer
        chainId={chainId}
        network={network}
        contractAddress={params.contractAddress}
        exists={exists}
        abi={abi}
        createPage={createPage}
      />
    </Suspense>
  );
}
