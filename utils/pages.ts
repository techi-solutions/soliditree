export type PageIdType = "address" | "pageId" | "reservedName" | "invalid";

export function detectPageIdType(pageId: string): PageIdType {
  if (!pageId.startsWith("0x")) {
    return "reservedName";
  }

  const idWithoutPrefix = pageId.slice(2);

  if (idWithoutPrefix.length === 40) {
    return "address";
  } else if (idWithoutPrefix.length === 64) {
    return "pageId";
  } else {
    return "invalid";
  }
}
