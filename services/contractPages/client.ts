"use client";

import ContractPagesABI from "@/abi/ContractPages.abi.json";

import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { networks, wagmiAdapter } from "../walletConnect/config";
import { extractEventData } from "@/utils/events";
import { AbiItem, parseEther, stringToHex } from "viem";

export const ContractPagesCreatePage = async (
  contractAddress: string,
  contentHash: string,
  onCreating: () => void
) => {
  const caipNetwork = networks.find((n) => n.chainId === 100);
  if (!caipNetwork) {
    return;
  }

  await wagmiAdapter.networkControllerClient?.switchCaipNetwork(caipNetwork);

  const contentHashBytes = stringToHex(contentHash);

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "createPage",
    args: [contractAddress, contentHashBytes],
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);
  console.log("result", result);

  onCreating();

  const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
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

export const ContractPagesDonate = async (
  contractAddress: string,
  amount: string,
  onCreating: () => void
) => {
  const caipNetwork = networks.find((n) => n.chainId === 100);
  if (!caipNetwork) {
    return;
  }

  await wagmiAdapter.networkControllerClient?.switchCaipNetwork(caipNetwork);

  const ethersAmount = parseEther(amount);

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "donate",
    value: ethersAmount,
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);
  console.log("result", result);

  onCreating();

  const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
    hash: result,
  });
  console.log("receipt", receipt);
  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  return receipt;
};
