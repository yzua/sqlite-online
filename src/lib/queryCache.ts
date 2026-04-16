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
      this.cache.delete(key);
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
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate cache entries for a specific table
   */
  invalidateTable(table: string): void {
    const prefix = `${table}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Current number of entries in the cache
   */
  get size(): number {
    return this.cache.size;
  }
}

// Create singleton instance for table data caching
export const tableDataCache = new QueryCache();
