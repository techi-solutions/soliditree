import { Config, deserialize, State } from "wagmi";

export const localWagmiStorage = {
  getItem(key: string) {
    if (typeof window === "undefined") return null;
    const value = window.localStorage.getItem(key);
    return value ?? null;
  },
  setItem(key: string, value: string) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(key);
  },
};

export function localWagmiToInitialState(config: Config) {
  if (typeof window === "undefined") return undefined;
  const key = `${config.storage?.key}.store`;
  const parsed = window.localStorage.getItem(key);
  if (!parsed) return undefined;
  return deserialize<{ state: State }>(parsed).state;
}
