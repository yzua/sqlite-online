import type { SqlValue } from "sql.js";
import type { TableSchema } from "@/types";

interface RowMeta {
  primaryValue: SqlValue | null;
  displayData: SqlValue[];
  rowKey: string;
}

// Pre-compute the PK column index from schema so each row lookup is O(1)
// instead of O(columns) via findIndex.
function resolvePkIndex(schema: TableSchema[string] | undefined): number {
  if (
    !schema ||
    schema.type === "view" ||
    !schema.primaryKey ||
    !schema.schema
  ) {
    return -1;
  }
  return schema.schema.findIndex((col) => col.name === schema.primaryKey);
}

// Batch version: compute PK index once, then O(1) per row.
export function getRowMetas(
  rows: SqlValue[][],
  schema: TableSchema[string] | undefined
): RowMeta[] {
  const pkIndex = resolvePkIndex(schema);

  return rows.map((row) => {
    const primaryValue = pkIndex >= 0 ? (row[pkIndex] ?? null) : null;
    const rowKey = primaryValue != null ? String(primaryValue) : row.join("|");
    return { primaryValue, displayData: row, rowKey };
  });
}
