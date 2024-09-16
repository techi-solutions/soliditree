import { ProxyContractService } from "../proxyContract";

export class ScanService {
  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = "https://api.etherscan.io/api",
    private readonly proxyContractService: ProxyContractService
  ) {}

  async getContractABI() {
    const address = await this.proxyContractService.getImplementationAddress();
    const response = await fetch(
      `${this.baseUrl}?module=contract&action=getabi&address=${address}&apikey=${this.apiKey}`
    );
    const data = await response.json();
    if (data.message !== "OK") {
      return null;
    }
    return JSON.parse(data.result);
  }
}
