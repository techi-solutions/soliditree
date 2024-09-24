"use client";

import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { wagmiConfig } from "../walletConnect/config";
import { AbiItem, parseEther } from "viem";
import { Network } from "@/constants/networks";

const DEFAULT_TIMEOUT = 120000;

export const ContractWriteFunction = async (
  network: Network,
  contractAddress: string,
  functionName: string,
  args: unknown[],
  abi: AbiItem[],
  onCreate: (txHash: string) => void,
  value?: string
) => {
  const valueBigInt = value ? parseEther(value) : undefined;
  const { request } = await simulateContract(wagmiConfig, {
    address: contractAddress as `0x${string}`,
    abi,
    functionName,
    args,
    value: valueBigInt,
    chainId: network.chainId,
  });

  const result = await writeContract(wagmiConfig, request);

  onCreate(result);

  const receipt = await waitForTransactionReceipt(wagmiConfig, {
    hash: result,
    timeout: DEFAULT_TIMEOUT,
  });

  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  return receipt;
};

export const ContractReadFunction = async (
  network: Network,
  contractAddress: string,
  functionName: string,
  args: unknown[],
  abi: AbiItem[]
) => {
  const result = await readContract(wagmiConfig, {
    address: contractAddress as `0x${string}`,
    abi,
    functionName,
    args,
    chainId: network.chainId,
  });

  return result as unknown;
};
