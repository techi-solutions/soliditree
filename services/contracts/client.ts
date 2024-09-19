"use client";

import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from "@wagmi/core";
import { networks, wagmiAdapter } from "../walletConnect/config";
import { AbiItem } from "viem";
import { Network } from "@/constants/networks";

export const ContractWriteFunction = async (
  network: Network,
  contractAddress: string,
  functionName: string,
  args: unknown[],
  abi: AbiItem[],
  onCreate: () => void,
  value?: string
) => {
  const caipNetwork = networks.find((n) => n.chainId === network.chainId);
  if (!caipNetwork) {
    return;
  }
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
  network: Network,
  contractAddress: string,
  functionName: string,
  args: unknown[],
  abi: AbiItem[]
) => {
  const caipNetwork = networks.find((n) => n.chainId === network.chainId);
  if (!caipNetwork) {
    return;
  }

  await wagmiAdapter.networkControllerClient?.switchCaipNetwork(caipNetwork);
  const result = await readContract(wagmiAdapter.wagmiConfig, {
    address: contractAddress as `0x${string}`,
    abi,
    functionName,
    args,
  });
  console.log("result", result);
  return result as unknown;
};
