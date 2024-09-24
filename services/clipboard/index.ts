"use client";

export interface ClipboardItem {
  type: string;
  name: string;
  value: unknown;
}

export class ClipboardService {
  pageId: string;
  items: ClipboardItem[] = [];

  store = typeof window === "undefined" ? mockLocalStorage : localStorage;

  constructor(pageId: string) {
    this.pageId = pageId;
    const fromStorage = this.store.getItem(`clipboard-${pageId}`);
    if (fromStorage) {
      const parsedValues = JSON.parse(fromStorage);
      this.items = parsedValues.map((item: ClipboardItem) =>
        typeof item.value === "bigint"
          ? { ...item, value: BigInt(item.value) }
          : item
      );
    }
  }

  addItem(item: ClipboardItem) {
    const existingIndex = this.items.findIndex(
      (existingItem) =>
        existingItem.value === item.value && existingItem.name === item.name
    );

    if (existingIndex !== -1) {
      this.items.splice(existingIndex, 1);
    }

    this.items.push(item);

    if (this.items.length > 30) {
      this.items.shift();
    }

    this.store.setItem(
      `clipboard-${this.pageId}`,
      JSON.stringify(
        this.items.map((item) =>
          typeof item.value === "bigint"
            ? { ...item, value: item.value.toString() }
            : item
        )
      )
    );
  }

  getItemsForType(type: string): ClipboardItem[] {
    return this.items.filter((item) => item.type === type);
  }

  getItems(): ClipboardItem[] {
    return this.items;
  }
}

const mockLocalStorage = {
  getItem: () => {
    return null;
  },
  setItem: () => {
    return;
  },
};
