"use client";

import ContractPagesABI from "@/abi/ContractPages.abi.json";

import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
  readContract,
} from "@wagmi/core";
import { networks, wagmiAdapter } from "../walletConnect/config";
import { extractEventData } from "@/utils/events";
import { AbiItem, parseEther, stringToHex } from "viem";
import { NETWORKS } from "@/constants/networks";

export const ContractPagesCreatePage = async (
  contractAddress: string,
  contentHash: string,
  onCreating: (txHash: string) => void
) => {
  const caipNetwork = networks.find((n) => n.chainId === 8453);
  if (!caipNetwork) {
    return;
  }

  await wagmiAdapter.networkControllerClient?.switchCaipNetwork(caipNetwork);

  const contentHashBytes = stringToHex(contentHash);

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "createPage",
    args: [contractAddress, contentHashBytes],
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);

  onCreating(result);

  const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
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
  const caipNetwork = networks.find((n) => n.chainId === 8453);
  if (!caipNetwork) {
    return;
  }

  console.log("caipNetwork", caipNetwork);

  await wagmiAdapter.networkControllerClient?.switchCaipNetwork(caipNetwork);

  const contentHashBytes = stringToHex(contentHash);

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  console.log("contractPagesAddress", contractPagesAddress);

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "updatePageContentHash",
    args: [pageId, contentHashBytes],
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);

  onUpdating(result);

  const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
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
  const caipNetwork = networks.find((n) => n.chainId === 8453);
  if (!caipNetwork) {
    return;
  }

  await wagmiAdapter.networkControllerClient?.switchCaipNetwork(caipNetwork);

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "destroyPage",
    args: [pageId],
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);

  onDestroying();

  const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
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
  const caipNetwork = networks.find((n) => n.chainId === 8453);
  if (!caipNetwork) {
    return;
  }

  await wagmiAdapter.networkControllerClient?.switchCaipNetwork(caipNetwork);

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const ethersAmount = parseEther(amount);

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "donate",
    value: ethersAmount,
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);

  onCreating();

  const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
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
  const caipNetwork = networks.find((n) => n.chainId === 8453);
  if (!caipNetwork) {
    return;
  }

  await wagmiAdapter.networkControllerClient?.switchCaipNetwork(caipNetwork);

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const ethersAmount = ethAmount ? parseEther(ethAmount) : undefined;

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "reserveName",
    args: [pageId, name, durationInMonths],
    value: ethersAmount,
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);

  onReserving();

  const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
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
  const caipNetwork = networks.find((n) => n.chainId === 8453);
  if (!caipNetwork) {
    throw new Error("Network not found");
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const result = (await readContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "getReservedName",
    args: [name],
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
  const caipNetwork = networks.find((n) => n.chainId === 8453);
  if (!caipNetwork) {
    throw new Error("Network not found");
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const result = (await readContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "calculateReservationCost",
    args: [BigInt(months), name],
  })) as bigint;

  return result;
};

export const ContractPagesShortNameThreshold = async (): Promise<number> => {
  const caipNetwork = networks.find((n) => n.chainId === 8453);
  if (!caipNetwork) {
    throw new Error("Network not found");
  }

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const result = (await readContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "shortNameThreshold",
  })) as bigint;

  return Number(result);
};
