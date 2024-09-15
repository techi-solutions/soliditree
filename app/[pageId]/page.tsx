import { ContractPagesService } from "@/services/contractPages";
import { Suspense } from "react";

export default async function NewContractPage({
  params,
}: {
  params: { pageId: string };
}) {
  const { pageId }: { pageId: string | undefined } = params;
  if (!pageId) {
    return <div>Page id is required</div>;
  }

  const contractPages = new ContractPagesService(
    process.env.GNOSIS_RPC_URL as string,
    process.env.GNOSIS_ADMIN_CONTRACT as string
  );

  let address: string | undefined;
  switch (pageId) {
    case "admin":
      address = process.env.GNOSIS_ADMIN_CONTRACT;
      break;
    default:
      if (pageId.startsWith("0x")) {
        address = await contractPages.getContractAddress(pageId);
      } else {
        address = await contractPages.getContractAddressByReservedName(pageId);
      }
      break;
  }

  if (!address) {
    return <div>Address not found</div>;
  }

  const abi = await contractPages.getAbiFromAddress(address);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div>
        <h1>Page {pageId}</h1>
        <div>{address}</div>
        <div>{JSON.stringify(abi)}</div>
      </div>
    </Suspense>
  );
}
