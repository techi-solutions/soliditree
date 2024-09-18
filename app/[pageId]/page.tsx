import { NETWORKS } from "@/constants/networks";
import { ContractPagesService } from "@/services/contractPages";
import IPFSService from "@/services/ipfs";
import { Suspense } from "react";
import ContractPageContainer from "@/containers/ContractPage";

export default async function NewContractPage({
  params,
  searchParams,
}: {
  params: { pageId: string };
  searchParams: { chainId: string };
}) {
  const { pageId }: { pageId: string | undefined } = params;
  const chainId = Number(searchParams.chainId);
  if (!pageId) {
    return <div>Page id is required</div>;
  }

  const network = NETWORKS[chainId];
  if (!network) {
    return <div>Network not found</div>;
  }

  const apiKey = process.env[`${network.name.toUpperCase()}_ETHERSCAN_API_KEY`];

  if (!apiKey) {
    throw new Error("ETHERSCAN_API_KEY is not set");
  }

  const contractPages = new ContractPagesService(
    network.rpcUrl,
    network.adminContractAddress
  );

  const ipfsService = new IPFSService(
    process.env.IPFS_URL as string,
    process.env.IPFS_API_KEY as string
  );

  let resolvedPageId = pageId;
  if (!pageId.startsWith("0x")) {
    resolvedPageId = await contractPages.getPageIdByReservedName(pageId);
  }

  const hash = await contractPages.getPageContentHash(resolvedPageId);
  const page = await ipfsService.getJSON(hash);

  if (!page) {
    return <div>Page not found</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContractPageContainer contractData={page} network={network} />
    </Suspense>
  );
}
