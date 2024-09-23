import { Config, deserialize, State } from "wagmi";

export const localWagmiStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    const value = localStorage.getItem(key);
    return value ?? null;
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
};

export function localWagmiToInitialState(config: Config) {
  const key = `${config.storage?.key}.store`;
  const parsed = localStorage.getItem(key);
  if (!parsed) return undefined;
  return deserialize<{ state: State }>(parsed).state;
}
