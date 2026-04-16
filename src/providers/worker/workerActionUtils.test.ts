import { describe, expect, it } from "vitest";
import type { TableSchema } from "@/types";
import {
  createNextFilters,
  createNextSorters,
  getNextPageOffset,
  getSelectedTableColumns
} from "./workerActionUtils";

const tablesSchema = {
  users: {
    primaryKey: "id",
    type: "table",
    schema: [
      {
        name: "id",
        cid: 0,
        type: "INTEGER",
        dflt_value: "",
        isNullable: false,
        isPrimaryKey: true,
        isForeignKey: false
      },
      {
        name: "name",
        cid: 1,
        type: "TEXT",
        dflt_value: "",
        isNullable: true,
        isPrimaryKey: false,
        isForeignKey: false
      }
    ]
  }
} satisfies TableSchema;

describe("workerActionUtils", () => {
  it("returns the selected table columns when the table exists", () => {
    expect(getSelectedTableColumns(tablesSchema, "users")).toEqual([
      "id",
      "name"
    ]);
  });

  it("merges filters for the changed column", () => {
    expect(createNextFilters({ status: "active" }, "name", "Ada")).toEqual({
      status: "active",
      name: "Ada"
    });
  });

  it("toggles a single-column sorter by default", () => {
    expect(createNextSorters({ name: "asc" }, "name")).toEqual({
      name: "desc"
    });
  });

  it("keeps existing sorters when mutable columns are enabled", () => {
    expect(createNextSorters({ createdAt: "desc" }, "name", true)).toEqual({
      createdAt: "desc",
      name: "desc"
    });
  });

  it("clamps page navigation at the collection bounds", () => {
    expect(getNextPageOffset("prev", 0, 25, 90)).toBe(0);
    expect(getNextPageOffset("next", 75, 25, 90)).toBe(75);
    expect(getNextPageOffset("last", 0, 25, 90)).toBe(65);
    expect(getNextPageOffset("first", 50, 25, 90)).toBe(0);
    expect(getNextPageOffset(40, 0, 25, 90)).toBe(40);
  });
});
