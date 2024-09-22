import { Abi, AbiFunction, keccak256, toBytes } from "viem";
import { ProxyContractService } from "../proxyContract";

export type AbiTextStyle = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "normal";

export const abiTextStyleClasses: Record<AbiTextStyle, string> = {
  h1: "text-5xl font-bold",
  h2: "text-4xl font-semibold",
  h3: "text-3xl font-semibold",
  h4: "text-2xl font-semibold",
  h5: "text-xl font-medium",
  h6: "text-lg font-medium",
  normal: "text-base",
};

export type AbiText = {
  style: AbiTextStyle;
  text: string;
};

// Define a new type that extends Abi with an 'id' property
// export type ExtendedAbiFunction = Abi & {Abi id: string }[];
export type ExtendedAbiItem = AbiFunction & {
  id: string;
  signature: string;
  selected: boolean;
  link?: {
    url: string;
  };
  text?: AbiText;
  separator?: {
    style: "solid" | "dashed" | "dotted";
    color: string;
    width: number;
  };
};

export type ExtendedAbi = ExtendedAbiItem[];

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
        signature: keccak256(
          toBytes(
            `${v.name}(${v.inputs.reduce(
              (acc, input, i) =>
                i === 0 ? `${acc}${input.type}` : `${acc},${input.type}`,
              ""
            )})`
          )
        ),
        selected: false,
      }));
  }
}
