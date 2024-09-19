"use client";

import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { wagmiAdapter } from "../walletConnect/config";
import { AbiItem } from "viem";

export const ContractWriteFunction = async (
  contractAddress: string,
  functionName: string,
  args: unknown[],
  abi: AbiItem[],
  onCreate: () => void,
  value?: string
) => {
  const valueBigInt = value ? BigInt(parseFloat(value) * 1e18) : undefined;

  const { request } = await simulateContract(wagmiAdapter.wagmiConfig, {
    address: contractAddress as `0x${string}`,
    abi,
    functionName,
    args,
    value: valueBigInt,
  });

  const result = await writeContract(wagmiAdapter.wagmiConfig, request);
  console.log("result", result);

  onCreate();

  const receipt = await waitForTransactionReceipt(wagmiAdapter.wagmiConfig, {
    hash: result,
  });
  console.log("receipt", receipt);
  if (receipt.status !== "success") {
    throw new Error("Transaction failed");
  }

  return receipt;
};

export const ContractReadFunction = async (
  contractAddress: string,
  functionName: string,
  args: unknown[],
  abi: AbiItem[]
) => {
  const result = await readContract(wagmiAdapter.wagmiConfig, {
    address: contractAddress as `0x${string}`,
    abi,
    functionName,
    args,
  });
  console.log("result", result);
  return result as unknown;
};
