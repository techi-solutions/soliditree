import { Suspense } from "react";
import NewContractPageContainer from "@/containers/NewContractPage";
import ContractPagesABI from "@/abi/ContractPages.abi.json";
import IPFSService from "@/services/ipfs";
import { ContractPage } from "@/services/contractPages";

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

export default function NewContractPage({
  params,
}: {
  params: { contractAddress: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewContractPageContainer
        contractAddress={params.contractAddress}
        abi={ContractPagesABI.abi}
        createPage={createPage}
      />
    </Suspense>
  );
}
