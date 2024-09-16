import { Abi, AbiFunction } from "viem";
import { ProxyContractService } from "../proxyContract";

// Define a new type that extends Abi with an 'id' property
// export type ExtendedAbiFunction = Abi & {Abi id: string }[];
export type ExtendedAbi = (AbiFunction & { id: string; selected: boolean })[];

export class ScanService {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://api.etherscan.io/api",
    private readonly proxyContractService: ProxyContractService
  ) {}

  async getContractABI(): Promise<ExtendedAbi> {
    const address = await this.proxyContractService.getImplementationAddress();
    const response = await fetch(
      `${this.baseUrl}?module=contract&action=getabi&address=${address}&apikey=${this.apiKey}`
    );
    const data = await response.json();
    if (data.message !== "OK") {
      return [];
    }

    const items: Abi = JSON.parse(data.result);

    return items
      .filter((v) => v.type === "function")
      .map((v) => ({
        ...v,
        id: `${v.name}(${v.inputs.reduce(
          (acc, input, i) =>
            i === 0
              ? `${acc}${input.name} ${input.type}`
              : `${acc},${input.name} ${input.type}`,
          ""
        )})`,
        selected: false,
      }));
  }
}
