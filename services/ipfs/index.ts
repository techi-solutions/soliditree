class IPFSService {
  private apiKey: string;
  private apiUrl: string;

  constructor(apiKey: string, apiUrl: string) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;
  }

  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "multipart/form-data",
      },
      body: formData,
    });

    const data = await response.json();
    return data.ipfsHash;
  }

  async uploadJSON(json: Record<string, unknown>): Promise<string> {
    const response = await fetch(`${this.apiUrl}/pinning/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(json),
    });

    const data = await response.json();
    return data.ipfsHash;
  }
}

export default IPFSService;
