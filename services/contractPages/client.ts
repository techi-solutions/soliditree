"use client";

import ContractPagesABI from "@/abi/ContractPages.abi.json";

import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
  readContract,
} from "@wagmi/core";
import { networks, wagmiConfig } from "../walletConnect/config";
import { extractEventData } from "@/utils/events";
import { AbiItem, parseEther, stringToHex } from "viem";
import { NETWORKS } from "@/constants/networks";

export const ContractPagesCreatePage = async (
  contractAddress: string,
  contentHash: string,
  onCreating: (txHash: string) => void
) => {
  const chainId = 8453;

  const caipNetwork = networks.find((n) => n.chainId === chainId);
  if (!caipNetwork) {
    return;
  }

  const contentHashBytes = stringToHex(contentHash);

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const { request } = await simulateContract(wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "createPage",
    args: [contractAddress, contentHashBytes],
    chainId: chainId,
  });

  const result = await writeContract(wagmiConfig, request);

  onCreating(result);

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash: result,
  });
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

  return pageId;
};

export const ContractPagesUpdatePageContentHash = async (
  pageId: string,
  contentHash: string,
  onUpdating: (txHash: string) => void
) => {
  const chainId = 8453;

  const caipNetwork = networks.find((n) => n.chainId === chainId);
  if (!caipNetwork) {
    return;
  }

  const contentHashBytes = stringToHex(contentHash);

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const { request } = await simulateContract(wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "updatePageContentHash",
    args: [pageId, contentHashBytes],
    chainId: chainId,
  });

  const result = await writeContract(wagmiConfig, request);

  onUpdating(result);

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash: result,
  });
  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  return receipt;
};

export const ContractPagesDestroyPage = async (
  pageId: string,
  onDestroying: () => void
) => {
  const chainId = 8453;

  const caipNetwork = networks.find((n) => n.chainId === chainId);
  if (!caipNetwork) {
    return;
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const { request } = await simulateContract(wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "destroyPage",
    args: [pageId],
    chainId: chainId,
  });

  const result = await writeContract(wagmiConfig, request);

  onDestroying();

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash: result,
  });
  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  return receipt;
};

export const ContractPagesDonate = async (
  amount: string,
  onCreating: () => void
) => {
  const chainId = 8453;

  const caipNetwork = networks.find((n) => n.chainId === chainId);
  if (!caipNetwork) {
    return;
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const ethersAmount = parseEther(amount);

  const { request } = await simulateContract(wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "donate",
    value: ethersAmount,
    chainId: chainId,
  });

  const result = await writeContract(wagmiConfig, request);

  onCreating();

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash: result,
  });
  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  return receipt;
};

export const ContractPagesReserveName = async (
  pageId: string,
  name: string,
  durationInMonths: number,
  onReserving: () => void,
  ethAmount?: string
) => {
  const chainId = 8453;

  const caipNetwork = networks.find((n) => n.chainId === chainId);
  if (!caipNetwork) {
    return;
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const ethersAmount = ethAmount ? parseEther(ethAmount) : undefined;

  const { request } = await simulateContract(wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "reserveName",
    args: [pageId, name, durationInMonths],
    value: ethersAmount,
    chainId: chainId,
  });

  const result = await writeContract(wagmiConfig, request);

  onReserving();

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash: result,
  });
  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  return receipt;
};

export const ContractPagesGetReservedName = async (
  name: string
): Promise<boolean> => {
  const chainId = 8453;

  const caipNetwork = networks.find((n) => n.chainId === chainId);
  if (!caipNetwork) {
    throw new Error("Network not found");
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const result = (await readContract(wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "getReservedName",
    args: [name],
    chainId: chainId,
  })) as string;

  // Check if result is truthy and not the empty address (0x0)
  const isReserved =
    !!result &&
    result !==
      "0x0000000000000000000000000000000000000000000000000000000000000000" &&
    result != "0x";

  return isReserved;
};

export const ContractPagesCalculateReservationCost = async (
  months: number,
  name: string
): Promise<bigint> => {
  const chainId = 8453;

  const caipNetwork = networks.find((n) => n.chainId === chainId);
  if (!caipNetwork) {
    throw new Error("Network not found");
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const result = (await readContract(wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "calculateReservationCost",
    args: [BigInt(months), name],
    chainId: chainId,
  })) as bigint;

  return result;
};

export const ContractPagesShortNameThreshold = async (): Promise<number> => {
  const chainId = 8453;

  const caipNetwork = networks.find((n) => n.chainId === chainId);
  if (!caipNetwork) {
    throw new Error("Network not found");
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const result = (await readContract(wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "shortNameThreshold",
    chainId: chainId,
  })) as bigint;

  return Number(result);
};
