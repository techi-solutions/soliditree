"use server";

import { PinataSDK } from "pinata-web3";
import { ContractPage } from "../contractPages";

class IPFSService {
  private pinata: PinataSDK;

  constructor(apiUrl: string, apiKey: string) {
    this.pinata = new PinataSDK({ pinataJwt: apiKey, pinataGateway: apiUrl });
  }

  async uploadFile(file: File): Promise<string> {
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeInBytes) {
      throw new Error("File size exceeds the maximum limit of 10MB");
    }

    const upload = await this.pinata.upload.file(file);
    return upload.IpfsHash;
  }

  async uploadJSON(json: Record<string, unknown>): Promise<string> {
    const jsonString = JSON.stringify(json);
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB

    if (new Blob([jsonString]).size > maxSizeInBytes) {
      throw new Error("JSON size exceeds the maximum limit of 10MB");
    }

    const upload = await this.pinata.upload.json(json);
    return upload.IpfsHash;
  }

  async getJSON(hash: string): Promise<ContractPage | null> {
    try {
      const response = await fetch(
        `${hash.replace(
          "ipfs://",
          `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/`
        )}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch JSON");
      }

      const page = (await response.json()) as ContractPage;

      page.icon = page.icon.replace(
        "ipfs://",
        `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/`
      );
      if (page.backgroundImage) {
        page.backgroundImage = page.backgroundImage.replace(
          "ipfs://",
          `${process.env.NEXT_PUBLIC_IPFS_GATEWAY}/ipfs/`
        );
      }

      return await page;
    } catch (error) {
      console.error(error);
      return null;
    }
  }
}

export default IPFSService;
