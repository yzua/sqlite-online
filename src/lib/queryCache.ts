/**
 * Simple LRU cache for database query results
 * Helps improve performance by caching frequently accessed data
 */

import type { Filters, Sorters } from "@/types";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class QueryCache<T = unknown> {
  private cache = new Map<string, CacheEntry<T>>();
  // Reverse index: table name → set of cache keys for fast invalidation
  private tableIndex = new Map<string, Set<string>>();
  private maxSize: number;
  private maxAge: number; // in milliseconds

  constructor(maxSize = 100, maxAge = 5 * 60 * 1000) {
    // 5 minutes default
    this.maxSize = maxSize;
    this.maxAge = maxAge;
  }

  /**
   * Generate cache key from query parameters
   */
  private generateKey(
    table: string,
    limit: number,
    offset: number,
    filters?: Filters,
    sorters?: Sorters
  ): string {
    const filterStr = filters ? JSON.stringify(filters) : "";
    const sorterStr = sorters ? JSON.stringify(sorters) : "";
    return `${table}:${limit}:${offset}:${filterStr}:${sorterStr}`;
  }

  /**
   * Get cached result if available and not expired
   */
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

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.deleteKey(key, table);
      return null;
    }

    // Promote to most-recently-used by reinserting at the end
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Store result in cache
   */
  set(
    table: string,
    limit: number,
    offset: number,
    data: T,
    filters?: Filters,
    sorters?: Sorters
  ): void {
    const key = this.generateKey(table, limit, offset, filters, sorters);

    // If cache is full, evict least-recently-used (first in Map order)
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

    // Update table index
    let keySet = this.tableIndex.get(table);
    if (!keySet) {
      keySet = new Set();
      this.tableIndex.set(table, keySet);
    }
    keySet.add(key);
  }

  /**
   * Invalidate cache entries for a specific table
   */
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

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.tableIndex.clear();
  }

  /**
   * Current number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }

  /** Remove a single key from both the cache and the table index */
  private deleteKey(key: string, table: string) {
    this.cache.delete(key);
    const keySet = this.tableIndex.get(table);
    if (keySet) {
      keySet.delete(key);
      if (keySet.size === 0) {
        this.tableIndex.delete(table);
      }
    }
  }
}

// Create singleton instance for table data caching
export const tableDataCache = new QueryCache();
