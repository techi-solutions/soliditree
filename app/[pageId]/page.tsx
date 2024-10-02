import { Metadata } from "next";
import { NETWORKS } from "@/constants/networks";
import { ContractPage, ContractPagesService } from "@/services/contractPages";
import IPFSService from "@/services/ipfs";
import { Suspense } from "react";
import Container from "@/components/Contract";
import { detectPageIdType } from "@/utils/pages";
import { redirect } from "next/navigation";

type Props = {
  params: { pageId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pageId }: { pageId: string | undefined } = params;

  const defaultMetadata: Metadata = {
    title: "Soliditree",
    description: "An interface for your smart contracts",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/assets/icon.svg", type: "image/svg+xml" },
      ],
      apple: "/assets/apple-icon.png",
    },
  };
  if (!pageId) {
    return defaultMetadata;
  }

  const network = NETWORKS["8453"];
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

    const iconUrl = page?.icon || "/favicon.ico";
    const pageLogoUrl = page?.icon || "/assets/logo.png";
    const title = page?.title || "Contract Page";
    const description = page?.description || "View contract details";
    const themeColor = page?.colors?.background || "#0f766e"; // Default color if not set

    return {
      title,
      description,
      icons: {
        icon: iconUrl,
        apple: pageLogoUrl,
      },
      themeColor,
      openGraph: {
        title,
        description,
        images: [{ url: pageLogoUrl }],
        type: "website",
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: [pageLogoUrl],
      },
      other: {
        "msapplication-TileImage": pageLogoUrl,
        "msapplication-TileColor": themeColor,
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

  const network = NETWORKS["8453"];
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

  const pageIdType = detectPageIdType(pageId);
  if (pageIdType === "invalid") {
    return <div>Invalid page id</div>;
  }

  if (pageIdType === "address") {
    redirect(`/contract/${pageId}`);
  }

  let resolvedPageId = pageId;
  if (pageIdType === "reservedName") {
    resolvedPageId = await contractPages.getPageIdByReservedName(pageId);
  }

  const ipfsService = new IPFSService(
    process.env.IPFS_URL as string,
    process.env.IPFS_API_KEY as string
  );

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

  // Fetch shortNameThreshold here
  const shortNameThreshold = await contractPages.getShortNameThreshold();

  const contractOwner = await contractPages.getContractOwner();

  const destroyPage = async (page: ContractPage) => {
    "use server";

    const ipfsService = new IPFSService(
      process.env.IPFS_URL as string,
      process.env.IPFS_API_KEY as string
    );

    // Unpin the JSON content
    await ipfsService.unpinFile(hash);

    // Unpin the icon if it exists
    if (page.icon && page.icon.startsWith("ipfs://")) {
      await ipfsService.unpinFile(page.icon.replace("ipfs://", ""));
    }

    // Unpin the background image if it exists
    if (page.backgroundImage && page.backgroundImage?.startsWith("ipfs://")) {
      await ipfsService.unpinFile(page.backgroundImage?.replace("ipfs://", ""));
    }
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <meta name="theme-color" content={page.colors?.background ?? "#0f766e"} />
      <Container
        pageId={pageId}
        usesReservedName={usesReservedName}
        owner={owner}
        contractOwner={contractOwner}
        contractData={page}
        network={contractNetwork}
        destroyPage={destroyPage}
        shortNameThreshold={shortNameThreshold} // Pass shortNameThreshold here
      />
    </Suspense>
  );
}
