import { Metadata } from "next";
import { NETWORKS } from "@/constants/networks";
import { ContractPagesService } from "@/services/contractPages";
import IPFSService from "@/services/ipfs";
import { Suspense } from "react";
import Container from "./container";
import Favicon from "@/public/favicon.ico";

type Props = {
  params: { pageId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pageId }: { pageId: string | undefined } = params;

  const defaultMetadata: Metadata = {
    title: "Soliditree",
    description: "An interface for your smart contracts",
    icons: {
      icon: "/favicon.ico",
    },
  };
  if (!pageId) {
    return defaultMetadata;
  }

  const network = NETWORKS["100"];
  if (!network) {
    return defaultMetadata;
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

  try {
    const hash = await contractPages.getPageContentHash(resolvedPageId);
    const page = await ipfsService.getJSON(hash);

    return {
      title: page?.title || "Contract Page",
      description: page?.description || "View contract details",
      icons: {
        icon: page?.icon || Favicon.src,
      },
    };
  } catch (error) {
    console.error("Error generating metadata", error);
    return defaultMetadata;
  }
}

export default async function Page({ params }: Props) {
  const { pageId }: { pageId: string | undefined } = params;
  if (!pageId) {
    return <div>Page id is required</div>;
  }

  const network = NETWORKS["100"];
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

  const contractNetwork = NETWORKS[page.chainId];
  if (!contractNetwork) {
    return <div>Unsupported network</div>;
  }

  const owner = await contractPages.getPageOwner(resolvedPageId);
  const usesReservedName = !pageId.startsWith("0x");

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <meta name="theme-color" content={page.colors?.background ?? "#0f766e"} />
      <Container
        usesReservedName={usesReservedName}
        owner={owner}
        contractData={page}
        network={contractNetwork}
      />
    </Suspense>
  );
}
