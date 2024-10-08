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

export interface ContractData {
  SourceCode: string;
  ABI: string;
  ContractName: string;
  CompilerVersion: string;
  OptimizationUsed: string;
  Runs: string;
  ConstructorArguments: string;
  EVMVersion: string;
  Library: string;
  LicenseType: string;
  Proxy: string;
  Implementation: string;
  SwarmSource: string;
}

export class ScanService {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://api.etherscan.io/api",
    private readonly proxyContractService: ProxyContractService
  ) {}

  async getContractABI(): Promise<[string, ExtendedAbi]> {
    const address = await this.proxyContractService.getImplementationAddress();
    const response = await fetch(
      `${this.baseUrl}?module=contract&action=getabi&address=${address}&apikey=${this.apiKey}`
    );
    const data = await response.json();
    if (data.message !== "OK") {
      return [address, []];
    }

    const items: Abi = JSON.parse(data.result);

    return [
      address,
      items
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
        })),
    ];
  }

  async getContractDetails(address: string): Promise<ContractData | null> {
    const response = await fetch(
      `${this.baseUrl}?module=contract&action=getsourcecode&address=${address}&apikey=${this.apiKey}`
    );
    const data = await response.json();

    if (
      data.status !== "1" ||
      data.message !== "OK" ||
      data.result.length === 0 ||
      !data.result[0].ContractName
    ) {
      console.error("Failed to fetch contract details:", data.message);
      return null;
    }

    const result = data.result[0];

    return {
      SourceCode: result.SourceCode,
      ABI: result.ABI,
      ContractName: result.ContractName,
      CompilerVersion: result.CompilerVersion,
      OptimizationUsed: result.OptimizationUsed,
      Runs: result.Runs,
      ConstructorArguments: result.ConstructorArguments,
      EVMVersion: result.EVMVersion,
      Library: result.Library,
      LicenseType: result.LicenseType,
      Proxy: result.Proxy,
      Implementation: result.Implementation,
      SwarmSource: result.SwarmSource,
    };
  }
}
