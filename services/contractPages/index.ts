import {
  Chain,
  createPublicClient,
  getContract,
  hexToString,
  http,
  PublicClient,
} from "viem";
import { gnosis } from "viem/chains";
import ContractPagesABI from "@/abi/ContractPages.abi.json";
import { ExtendedAbi } from "../scan";

export interface ContractPage {
  chainId: number;
  contractAddress: string;
  title: string;
  description: string;
  website?: string;
  icon?: string;
  functions: ExtendedAbi;
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
    private readonly chain: Chain = gnosis
  ) {
    this.client = createPublicClient({
      chain: this.chain,
      transport: http(this.rpcUrl),
    });
  }

  async contractExists() {
    const result = await this.client.getCode({
      address: this.contractAddress as `0x${string}`,
    });

    return result !== "0x" && !!result;
  }

  async getPageContentHash(pageId: string) {
    const result = await this.contract().read.pageContentHashes([pageId]);
    return hexToString(result as `0x${string}`);
  }

  async getContractAddress(pageId: string) {
    const result = await this.contract().read.pageContractAddresses([pageId]);
    console.log("result", result);
    return result as string;
  }

  async getPageIdByReservedName(reservedName: string) {
    const result = await this.contract().read.getReservedName([reservedName]);
    return result as string;
  }

  async getAbiFromAddress(address: string) {
    console.log(address);
    const result = this.contract().abi;
    return result;
  }
}
