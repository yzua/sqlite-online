import type { Filters, Sorters } from "@/types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  // Reverse index: table name → set of cache keys for fast invalidation
  private tableIndex = new Map<string, Set<string>>();
  // Tracks the most-recently-used key so get() can skip promotion in O(1)
  // when the entry is already at the end of the Map (the common case during
  // sequential pagination).
  private mruKey: string | null = null;
  private maxSize: number;
  private maxAge: number;

  constructor(maxSize = 100, maxAge = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  private generateKey(
    table: string,
    limit: number,
    offset: number,
    filters?: Filters,
    sorters?: Sorters
  ): string {
    // Fast path: most queries have no filters or sorters.
    if (!filters && !sorters) {
      return `${table}:${limit}:${offset}:`;
    }
    const filterStr = filters ? JSON.stringify(filters) : "";
    const sorterStr = sorters ? JSON.stringify(sorters) : "";
    return `${table}:${limit}:${offset}:${filterStr}:${sorterStr}`;
  }

  get(
    table: string,
    limit: number,
    offset: number,
    filters?: Filters,
    sorters?: Sorters
  ): T | null {
    const key = this.generateKey(table, limit, offset, filters, sorters);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.maxAge) {
      this.deleteKey(key, table);
      return null;
    }

    // Promote to MRU only when not already the last entry. During sequential
    // pagination the same key is repeatedly accessed, so this branch is
    // usually skipped — saving two Map operations per hit.
    if (this.mruKey !== key) {
      this.cache.delete(key);
      this.cache.set(key, entry);
      this.mruKey = key;
    }

    return entry.data;
  }

  set(
    table: string,
    limit: number,
    offset: number,
    data: T,
    filters?: Filters,
    sorters?: Sorters
  ): void {
    const key = this.generateKey(table, limit, offset, filters, sorters);

    // Evict least-recently-used when full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        const oldestTable = oldestKey.slice(0, oldestKey.indexOf(":"));
        this.deleteKey(oldestKey, oldestTable);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    this.mruKey = key;

    let keySet = this.tableIndex.get(table);
    if (!keySet) {
      keySet = new Set();
      this.tableIndex.set(table, keySet);
    }
    keySet.add(key);
  }

  invalidateTable(table: string): void {
    const keySet = this.tableIndex.get(table);
    if (!keySet) {
      return;
    }

    for (const key of keySet) {
      this.cache.delete(key);
    }

    this.tableIndex.delete(table);
  }

  clear(): void {
    this.cache.clear();
    this.tableIndex.clear();
    this.mruKey = null;
  }

  get size(): number {
    return this.cache.size;
  }

  private deleteKey(key: string, table: string) {
    this.cache.delete(key);
    if (this.mruKey === key) {
      this.mruKey = null;
    }
    const keySet = this.tableIndex.get(table);
    if (keySet) {
      keySet.delete(key);
      if (keySet.size === 0) {
        this.tableIndex.delete(table);
      }
    }
  }
}

export const tableDataCache = new QueryCache();
