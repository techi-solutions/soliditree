import { createPublicClient, getContract, http, PublicClient } from "viem";
import { Chain, mainnet } from "viem/chains";
import ContractPagesABI from "@/abi/ContractPages.abi.json";

export interface ContractPageFunction {
  name: string;
  inputs: {
    name: string;
    type: string;
  }[];
  outputs: {
    name: string;
    type: string;
  }[];
}
export interface ContractPage {
  title: string;
  description: string;
  website?: string;
  icon?: string;
  functions: ContractPageFunction[];
}

export class ContractPagesService {
  private client: PublicClient;
  private contract = () =>
    getContract({
      address: this.contractAddress as `0x${string}`,
      abi: ContractPagesABI.abi,
      client: this.client,
    });

  constructor(
    private readonly rpcUrl: string,
    private readonly contractAddress: string,
    private readonly chain: Chain = mainnet
  ) {
    this.client = createPublicClient({
      chain: this.chain,
      transport: http(this.rpcUrl),
    });
  }

  async getContractAddress(pageId: string) {
    const result = await this.contract().read.pageContractAddresses([pageId]);
    return result as string;
  }

  async getContractAddressByReservedName(reservedName: string) {
    const result = await this.contract().read.getReservedName([reservedName]);
    return result as string;
  }

  async getAbiFromAddress(address: string) {
    console.log(address);
    const result = this.contract().abi;
    return result;
  }

  // Add more methods here for other contract interactions
}
