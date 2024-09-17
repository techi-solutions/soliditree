"use client";

import ContractPagesABI from "@/abi/ContractPages.abi.json";

import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { config } from "../walletConnect/config";
import { extractEventData } from "@/utils/events";
import { AbiItem, stringToHex } from "viem";

export const ContractPagesCreatePage = async (
  contractAddress: string,
  contentHash: string,
  onCreating: () => void
) => {
  const contentHashBytes = stringToHex(contentHash);

  const { request } = await simulateContract(config, {
    address: contractAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "createPage",
    args: [contractAddress, contentHashBytes],
  });

  const result = await writeContract(config, request);
  console.log("result", result);

  onCreating();

  const receipt = await waitForTransactionReceipt(config, {
    hash: result,
  });
  console.log("receipt", receipt);
  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  const eventData = extractEventData(
    ContractPagesABI.abi as AbiItem[],
    receipt,
    "PageCreated"
  );

  if (eventData.length === 0) {
    throw new Error("No event data found");
  }

  const event = eventData[0];

  const pageId = (event.args as { pageId: string | undefined }).pageId;

  if (!pageId) {
    throw new Error("No page id found");
  }

  console.log("eventData", eventData);

  return pageId;
};
