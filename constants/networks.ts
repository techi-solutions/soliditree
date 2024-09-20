export interface Network {
  chainId: number;
  name: string;
  symbol: string;
  explorer: string;
  explorerApi: string;
  rpcUrl: string;
  wsRpcUrl: string;
  adminContractAddress: string;
}

interface Networks {
  [key: string]: Network;
}

export const NETWORKS: Networks = {
  "100": {
    chainId: 100,
    name: "Gnosis",
    symbol: "xDAI",
    explorer: "https://gnosisscan.io",
    explorerApi: "https://api.gnosisscan.io/api",
    rpcUrl:
      "https://nd-186-204-791.p2pify.com/e5512c5ca6fba9a6a20ccbbb8960799f",
    wsRpcUrl:
      "wss://ws-nd-186-204-791.p2pify.com/e5512c5ca6fba9a6a20ccbbb8960799f",
    adminContractAddress: process.env.GNOSIS_ADMIN_CONTRACT as string,
  },
  "137": {
    chainId: 137,
    name: "Polygon",
    symbol: "MATIC",
    explorer: "https://polygonscan.com",
    explorerApi: "https://api.polygonscan.com/api",
    rpcUrl:
      "https://nd-147-012-483.p2pify.com/d8ba4ac942ec62a14e0cc844d373d9d2",
    wsRpcUrl:
      "wss://ws-nd-147-012-483.p2pify.com/d8ba4ac942ec62a14e0cc844d373d9d2",
    adminContractAddress: process.env.GNOSIS_ADMIN_CONTRACT as string,
  },
  "8453": {
    chainId: 8453,
    name: "Base",
    symbol: "Ether",
    explorer: "https://basescan.org/",
    explorerApi: "https://api.basescan.org/api",
    rpcUrl:
      "https://nd-231-060-478.p2pify.com/1200e5d6ce27d6e7cd61ab0567a9927e",
    wsRpcUrl:
      "wss://ws-nd-231-060-478.p2pify.com/1200e5d6ce27d6e7cd61ab0567a9927e",
    adminContractAddress: process.env.GNOSIS_ADMIN_CONTRACT as string,
  },
  "84532": {
    chainId: 84532,
    name: "Base Sepolia",
    symbol: "Ether",
    explorer: "https://sepolia.basescan.org/",
    explorerApi: "https://api.basescan.org/api",
    rpcUrl: "https://base-sepolia-rpc.publicnode.com",
    wsRpcUrl: "wss://base-sepolia-rpc.publicnode.com",
    adminContractAddress: process.env.GNOSIS_ADMIN_CONTRACT as string,
  },
  "42220": {
    chainId: 42220,
    name: "CELO",
    symbol: "CELO",
    explorer: "https://celoscan.io",
    explorerApi: "https://api.celoscan.io/api",
    rpcUrl:
      "https://stylish-floral-morning.celo-mainnet.quiknode.pro/1de8e39f6e2189f62b565360b05569f33d40801d",
    wsRpcUrl:
      "wss://stylish-floral-morning.celo-mainnet.quiknode.pro/1de8e39f6e2189f62b565360b05569f33d40801d",
    adminContractAddress: process.env.GNOSIS_ADMIN_CONTRACT as string,
  },
  "44787": {
    chainId: 44787,
    name: "CELO Alfajores",
    symbol: "CELO",
    explorer: "https://alfajores.celoscan.io",
    explorerApi: "https://api.celoscan.io/api",
    rpcUrl: "https://rpc-mainnet.maticvigil.com",
    wsRpcUrl: "wss://rpc-mainnet.maticvigil.com/ws",
    adminContractAddress: process.env.GNOSIS_ADMIN_CONTRACT as string,
  },
  "42161": {
    chainId: 42161,
    name: "Arbitrum",
    symbol: "Ether",
    explorer: "https://arbiscan.io",
    explorerApi: "https://api.arbiscan.io/api",
    rpcUrl:
      "https://arbitrum-mainnet.core.chainstack.com/1bb2d90f85b74101e81f2225fbeb7ef8",
    wsRpcUrl:
      "wss://arbitrum-mainnet.core.chainstack.com/1bb2d90f85b74101e81f2225fbeb7ef8",
    adminContractAddress: process.env.GNOSIS_ADMIN_CONTRACT as string,
  },
};
