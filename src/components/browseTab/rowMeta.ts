import type { SqlValue } from "sql.js";
import type { TableSchema } from "@/types";

interface RowMeta {
  primaryValue: SqlValue | null;
  displayData: SqlValue[];
}

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
