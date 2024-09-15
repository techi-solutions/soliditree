"use server";

import { PinataSDK } from "pinata-web3";

class IPFSService {
  private pinata: PinataSDK;

  constructor(apiUrl: string, apiKey: string) {
    this.pinata = new PinataSDK({ pinataJwt: apiKey, pinataGateway: apiUrl });
  }

  async uploadFile(file: File): Promise<string> {
    const upload = await this.pinata.upload.file(file);

    return upload.IpfsHash;
  }

  async uploadJSON(json: Record<string, unknown>): Promise<string> {
    const upload = await this.pinata.upload.json(json);
    return upload.IpfsHash;
  }
}

export default IPFSService;
