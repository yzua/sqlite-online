import type { Sorters, TableQueryPayload, TableSchema } from "@/types";

export function createTableQueryPayload(
  payload: TableQueryPayload
): TableQueryPayload {
  return payload;
}

export function getSelectedTableColumns(
  tablesSchema: TableSchema,
  selectedTable: string
) {
  return (
    tablesSchema[selectedTable]?.schema.map((column) => column.name) ?? null
  );
}

export function createNextFilters(
  currentFilters: Record<string, string> | null,
  column: string,
  value: string
) {
  return { ...(currentFilters || {}), [column]: value };
}

export function createNextSorters(
  currentSorters: Sorters,
  column: string,
  isMutableColumns = false
): Sorters {
  const nextOrder =
    (currentSorters?.[column] || "asc") === "asc" ? "desc" : "asc";

  return isMutableColumns
    ? { ...(currentSorters || {}), [column]: nextOrder }
    : { [column]: nextOrder };
}

export function getNextPageOffset(
  type: "next" | "prev" | "first" | "last" | number,
  currentOffset: number,
  limit: number,
  maxSize: number
) {
  if (typeof type === "number") {
    return type;
  }

  if (type === "next") {
    const nextOffset = currentOffset + limit;
    return nextOffset >= maxSize
      ? maxSize - limit < 0
        ? 0
        : currentOffset
      : nextOffset;
  }

  if (type === "prev") {
    return Math.max(currentOffset - limit, 0);
  }

  if (type === "first") {
    return 0;
  }

  return maxSize - limit < 0 ? 0 : maxSize - limit;
}
