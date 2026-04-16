import { beforeEach, describe, expect, it, vi } from "vitest";
import { tableDataCache } from "./queryCache";

describe("tableDataCache", () => {
  beforeEach(() => {
    tableDataCache.clear();
    vi.useRealTimers();
  });

  it("returns cached data only for the exact query key", () => {
    const rows = [[1, "Ada"]];
    tableDataCache.set("users", 25, 0, rows, { role: "admin" }, { id: "asc" });

    expect(
      tableDataCache.get("users", 25, 0, { role: "admin" }, { id: "asc" })
    ).toBe(rows);
    expect(
      tableDataCache.get("users", 25, 25, { role: "admin" }, { id: "asc" })
    ).toBeNull();
  });

  it("expires stale entries on read", () => {
    vi.useFakeTimers();
    tableDataCache.set("users", 25, 0, [[1]]);

    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    expect(tableDataCache.get("users", 25, 0)).toBeNull();
    expect(tableDataCache.size).toBe(0);
  });

  it("evicts the least recently used entry when the singleton cache is full", () => {
    vi.useFakeTimers();

    for (let index = 0; index < 100; index++) {
      vi.setSystemTime(index);
      tableDataCache.set(`table-${index}`, 25, 0, [[index]]);
    }

    vi.setSystemTime(1_000);
    expect(tableDataCache.get("table-0", 25, 0)).toEqual([[0]]);

    vi.setSystemTime(2_000);
    tableDataCache.set("table-100", 25, 0, [[100]]);

    expect(tableDataCache.get("table-1", 25, 0)).toBeNull();
    expect(tableDataCache.get("table-0", 25, 0)).toEqual([[0]]);
    expect(tableDataCache.size).toBe(100);
  });

  it("invalidates only entries for the targeted table", () => {
    tableDataCache.set("users", 25, 0, [[1]]);
    tableDataCache.set("orders", 25, 0, [[2]]);

    tableDataCache.invalidateTable("users");

    expect(tableDataCache.get("users", 25, 0)).toBeNull();
    expect(tableDataCache.get("orders", 25, 0)).toEqual([[2]]);
  });
});
