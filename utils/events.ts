import { AbiItem, decodeEventLog, TransactionReceipt } from "viem";

export const extractEventData = (
  abi: AbiItem[],
  receipt: TransactionReceipt,
  eventName: string
) => {
  const eventAbi = abi.find(
    (item) => item.type === "event" && item.name === eventName
  );

  if (!eventAbi) {
    throw new Error(`Event ${eventName} not found in ABI`);
  }

  const eventLogs = receipt.logs
    .map((log) => {
      try {
        return decodeEventLog({
          abi: [eventAbi],
          data: log.data,
          topics: log.topics,
        });
      } catch {
        return null;
      }
    })
    .filter((log): log is NonNullable<typeof log> => log !== null);

  return eventLogs;
};
