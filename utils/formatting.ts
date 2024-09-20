export const formatArg = (type: string, value: string): unknown => {
  switch (type) {
    case "uint256":
    case "int256":
      return value ? BigInt(value) : BigInt(0);
    case "bool":
      return value.toLowerCase() === "true";
    case "address":
      return value || "0x0000000000000000000000000000000000000000";
    case "string":
      return value;
    case "bytes":
      return value ? `0x${value.replace(/^0x/, "")}` : "0x";
    case "bytes32":
      return value
        ? `0x${value.replace(/^0x/, "").padEnd(64, "0")}`
        : "0x" + "0".repeat(64);
    default:
      if (type.includes("[]")) {
        return value
          .split(",")
          .map((v) => formatArg(type.replace("[]", ""), v.trim()));
      }
      return value;
  }
};
