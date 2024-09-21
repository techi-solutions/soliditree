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
import { NETWORKS } from "@/constants/networks";

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

  const contractPagesAddress =
    NETWORKS[caipNetwork.chainId].adminContractAddress;

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractPagesAddress as `0x${string}`,
    abi: ContractPagesABI.abi,
    functionName: "createPage",
    args: [contractAddress, contentHashBytes],
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);

  onCreating();

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
  onUpdating: () => void
) => {
  const caipNetwork = networks.find((n) => n.chainId === 100);
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

  onUpdating();

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
  const caipNetwork = networks.find((n) => n.chainId === 100);
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
  const caipNetwork = networks.find((n) => n.chainId === 100);
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
