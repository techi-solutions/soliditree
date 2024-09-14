import { Suspense } from "react";
import NewContractPageContainer from "@/containers/NewContractPage";

export default function NewContractPage({
  params,
}: {
  params: { contractAddress: string };
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewContractPageContainer contractAddress={params.contractAddress} />
    </Suspense>
  );
}
