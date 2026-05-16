import { describe, expect, it } from "vitest";
import {
  arrayToCSV,
  buildOrderByClause,
  buildWhereClause,
  isStructureChangeable,
  normalizeSqlStatement,
  sanitizeIdentifier
} from "@/sqlite/sqlUtils";

describe("sqlUtils", () => {
  describe("normalizeSqlStatement", () => {
    it("replaces COLLATE unicase with COLLATE NOCASE", () => {
      expect(
        normalizeSqlStatement("SELECT * FROM t ORDER BY name COLLATE unicase")
      ).toBe("SELECT * FROM t ORDER BY name COLLATE NOCASE");
    });

    it("handles mixed case", () => {
      expect(normalizeSqlStatement("COLLATE UNICASE")).toBe("COLLATE NOCASE");
    });

    it("handles multiple occurrences", () => {
      expect(
        normalizeSqlStatement(
          "SELECT a COLLATE unicase, b COLLATE unicase FROM t"
        )
      ).toBe("SELECT a COLLATE NOCASE, b COLLATE NOCASE FROM t");
    });

    it("leaves non-unicase COLLATE untouched", () => {
      expect(normalizeSqlStatement("COLLATE NOCASE")).toBe("COLLATE NOCASE");
    });
  });

  describe("isStructureChangeable", () => {
    it("detects CREATE statements", () => {
      expect(isStructureChangeable("CREATE TABLE foo (id INT)")).toBe(true);
    });

    it("detects DROP statements", () => {
      expect(isStructureChangeable("DROP TABLE foo")).toBe(true);
    });

    it("detects ALTER statements", () => {
      expect(isStructureChangeable("ALTER TABLE foo ADD COLUMN bar TEXT")).toBe(
        true
      );
    });

    it("detects leading whitespace", () => {
      expect(isStructureChangeable("  CREATE TABLE foo (id INT)")).toBe(true);
    });

    it("ignores SELECT", () => {
      expect(isStructureChangeable("SELECT * FROM foo")).toBe(false);
    });

    it("ignores INSERT", () => {
      expect(isStructureChangeable("INSERT INTO foo VALUES (1)")).toBe(false);
    });
  });

  describe("sanitizeIdentifier", () => {
    it("wraps in double quotes", () => {
      expect(sanitizeIdentifier("name")).toBe('"name"');
    });

    it("escapes internal double quotes", () => {
      expect(sanitizeIdentifier('col"umn')).toBe('"col""umn"');
    });

    it("handles empty string", () => {
      expect(sanitizeIdentifier("")).toBe('""');
    });
  });

  describe("buildWhereClause", () => {
    it("returns empty for null filters", () => {
      expect(buildWhereClause(null)).toEqual({ clause: "", params: [] });
    });

    it("returns empty for empty object", () => {
      expect(buildWhereClause({})).toEqual({ clause: "", params: [] });
    });

    it("builds single-column LIKE clause", () => {
      const result = buildWhereClause({ name: "Ada" });
      expect(result.clause).toBe("WHERE \"name\" LIKE ? ESCAPE '\\'");
      expect(result.params).toEqual(["%Ada%"]);
    });

    it("builds multi-column clause with AND", () => {
      const result = buildWhereClause({ name: "A", email: "b@" });
      expect(result.clause).toContain("AND");
      expect(result.params).toEqual(["%A%", "%b@%"]);
    });

    it("sanitizes column names", () => {
      const result = buildWhereClause({ 'col"umn': "val" });
      expect(result.clause).toContain('"col""umn"');
    });
  });

  describe("buildOrderByClause", () => {
    it("returns empty for null sorters", () => {
      expect(buildOrderByClause(null)).toBe("");
    });

    it("builds single-column ORDER BY", () => {
      expect(buildOrderByClause({ name: "asc" })).toBe('ORDER BY "name" ASC');
    });

    it("defaults to ASC for unknown direction", () => {
      expect(buildOrderByClause({ name: "sideways" as never })).toBe(
        'ORDER BY "name" ASC'
      );
    });

    it("handles DESC", () => {
      expect(buildOrderByClause({ id: "desc" })).toBe('ORDER BY "id" DESC');
    });
  });

  describe("arrayToCSV", () => {
    it("converts columns and rows to CSV", () => {
      expect(
        arrayToCSV(
          ["id", "name"],
          [
            [1, "Ada"],
            [2, "Bob"]
          ]
        )
      ).toBe('"id","name"\n"1","Ada"\n"2","Bob"');
    });

    it("handles null values as empty string", () => {
      expect(arrayToCSV(["id"], [[null]])).toBe('"id"\n""');
    });

    it("handles empty rows", () => {
      expect(arrayToCSV(["id"], [])).toBe('"id"');
    });
  });
});
