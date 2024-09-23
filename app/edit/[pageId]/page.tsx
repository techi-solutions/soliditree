import { NETWORKS } from "@/constants/networks";
import { ContractPagesService } from "@/services/contractPages";
import IPFSService from "@/services/ipfs";
import Container from "./container";
import { ContractPage, ContractPageColors } from "@/services/contractPages";
import { ExtendedAbi } from "@/services/scan";

const ipfsService = new IPFSService(
  process.env.IPFS_URL as string,
  process.env.IPFS_API_KEY as string
);

export default async function Page({ params }: { params: { pageId: string } }) {
  const { pageId } = params;

  const network = NETWORKS["8453"];
  if (!network) {
    return <div>Network not found</div>;
  }

  const contractPages = new ContractPagesService(
    network.rpcUrl,
    network.adminContractAddress
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

  const editPage = async (
    formData: FormData,
    functions: ExtendedAbi,
    colors: ContractPageColors
  ) => {
    "use server";

    if (functions.length === 0) {
      throw new Error("No functions selected");
    }

    const icon = formData.get("icon") as File | undefined;
    const backgroundImage = formData.get("backgroundImage") as File | undefined;

    const uploadData: ContractPage = {
      chainId: page.chainId,
      contractAddress: page.contractAddress,
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      website: formData.get("website") as string,
      icon: page.icon,
      backgroundImage: page.backgroundImage,
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

    const newHash = await ipfsService.uploadJSON(
      uploadData as unknown as Record<string, unknown>
    );

    return { newHash, uploadData, oldHash: hash };
  };

  const unpinOldContent = async (
    oldHash: string,
    oldPage: ContractPage,
    newPage: ContractPage
  ) => {
    "use server";

    await ipfsService.unpinFile(oldHash);
    if (oldPage.icon && oldPage.icon !== newPage.icon) {
      await ipfsService.unpinFile(oldPage.icon.replace("ipfs://", ""));
    }
    if (
      oldPage.backgroundImage &&
      oldPage.backgroundImage !== newPage.backgroundImage
    ) {
      await ipfsService.unpinFile(
        oldPage.backgroundImage.replace("ipfs://", "")
      );
    }
  };

  return (
    <Container
      pageId={pageId}
      network={network}
      resolvedPageId={resolvedPageId}
      contractPage={page}
      editPage={editPage}
      unpinOldContent={unpinOldContent}
    />
  );
}
