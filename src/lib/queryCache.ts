/**
 * Simple LRU cache for database query results
 * Helps improve performance by caching frequently accessed data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
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
    filters?: Record<string, string> | null,
    sorters?: Record<string, string> | null
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
    filters?: Record<string, string> | null,
    sorters?: Record<string, string> | null
  ): T | null {
    const key = this.generateKey(table, limit, offset, filters, sorters);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if entry is expired
    if (now - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

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
    filters?: Record<string, string> | null,
    sorters?: Record<string, string> | null
  ): void {
    const key = this.generateKey(table, limit, offset, filters, sorters);
    const now = Date.now();

    // If cache is full, remove least recently used entry
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });
  }

  /**
   * Invalidate cache entries for a specific table
   */
  invalidateTable(table: string): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(`${table}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      accessCount: number;
      age: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      age: now - entry.timestamp
    }));

    // Calculate hit rate (simplified - would need request tracking for accurate rate)
    const totalAccesses = entries.reduce(
      (sum, entry) => sum + entry.accessCount,
      0
    );
    const hitRate = entries.length > 0 ? totalAccesses / entries.length : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      entries
    };
  }
}

// Create singleton instance for table data caching
export const tableDataCache = new QueryCache();

// Create singleton instance for custom query caching
export const customQueryCache = new QueryCache(50, 2 * 60 * 1000); // 2 minutes for custom queries

export default QueryCache;
