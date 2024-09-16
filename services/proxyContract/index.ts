import {
  Chain,
  createPublicClient,
  getContract,
  http,
  PublicClient,
} from "viem";
import { gnosis } from "viem/chains";
import ProxyContractABI from "@/abi/ERC1967Proxy.abi.json";

export class ProxyContractService {
  private client: PublicClient;
  private contract = () =>
    getContract({
      address: this.contractAddress as `0x${string}`,
      abi: ProxyContractABI.abi,
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

  async getImplementationAddress() {
    try {
      const ERC1967_IMPLEMENTATION_SLOT =
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementationAddress = await this.client.getStorageAt({
        address: this.contractAddress as `0x${string}`,
        slot: ERC1967_IMPLEMENTATION_SLOT,
      });

      if (!implementationAddress) {
        return this.contractAddress;
      }

      // Trim leading zeros and take the last 40 characters (20 bytes) for the address
      const trimmedAddress = `0x${implementationAddress.slice(-40)}`;
      console.log("Trimmed implementationAddress", trimmedAddress);

      console.log("implementationAddress", implementationAddress);

      const hasImplementation =
        trimmedAddress !== "0x" &&
        trimmedAddress !==
          "0x0000000000000000000000000000000000000000000000000000000000000000" &&
        !!trimmedAddress;
      if (!hasImplementation) {
        return this.contractAddress;
      }

      return trimmedAddress;
    } catch (e) {
      console.log("error", e);
      return this.contractAddress;
    }
  }

  async getImplementationContractAddress() {
    const result = await this.contract().read.implementation();
    console.log("implementation", result);
    return result as string | undefined;
  }

  async isERC1967Proxy(): Promise<boolean> {
    try {
      const ERC1967_IMPLEMENTATION_SLOT =
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
      const implementationAddress = await this.client.getStorageAt({
        address: this.contractAddress as `0x${string}`,
        slot: ERC1967_IMPLEMENTATION_SLOT,
      });
      return (
        implementationAddress !== "0x" &&
        implementationAddress !==
          "0x0000000000000000000000000000000000000000000000000000000000000000" &&
        !!implementationAddress
      );
    } catch (error) {
      console.error("Error checking for ERC1967 proxy:", error);
      return false;
    }
  }

  // Add more methods here for other contract interactions
}
