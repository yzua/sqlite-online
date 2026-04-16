import type { SqlValue } from "sql.js";
import type { TableSchema } from "@/types";

interface RowMeta {
  primaryValue: SqlValue | null;
  displayData: SqlValue[];
}

// When a primary key exists and the table is not a view, Sqlite.getTableData
// prepends the PK column to the SELECT (e.g. `SELECT "id", *`). This means
// row[0] is the PK value (duplicated) and row.slice(1) is the display data.
// See src/sqlite/core.ts getTableData selectClause construction.
export function getRowMeta(
  row: SqlValue[],
  schema: TableSchema[string] | undefined
): RowMeta {
  const isView = schema?.type === "view";
  const primaryKey = schema?.primaryKey;
  const primaryValue = primaryKey && !isView ? (row[0] ?? null) : null;
  const displayData = primaryKey && !isView ? row.slice(1) : row;
  return { primaryValue, displayData };
}
