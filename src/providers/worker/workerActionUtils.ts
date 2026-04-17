import type { SqlValue } from "sql.js";
import type {
  Filters,
  Sorters,
  TableQueryPayload,
  TableSchema,
  WorkerEvent
} from "@/types";

interface BrowseStateActions {
  setFilters: (f: Filters) => void;
  setSorters: (s: Sorters) => void;
  resetPagination: () => void;
}

/**
 * Reset all browse-navigation state (filters, sorters, pagination).
 * Used both when the worker sends initComplete and when the user switches tables.
 */
export function resetBrowseState(store: BrowseStateActions) {
  store.setFilters(null);
  store.setSorters(null);
  store.resetPagination();
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
  currentFilters: Filters,
  column: string,
  value: string
) {
  return { ...(currentFilters || {}), [column]: value };
}

export function createNextSorters(
  currentSorters: Sorters,
  column: string
): Sorters {
  const nextOrder =
    (currentSorters?.[column] || "asc") === "asc" ? "desc" : "asc";

  return { [column]: nextOrder };
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

export function buildDeleteMessage(
  table: string,
  primaryValue: SqlValue,
  queryPayload: Pick<
    TableQueryPayload,
    "limit" | "offset" | "filters" | "sorters"
  >
): WorkerEvent {
  return {
    action: "delete",
    payload: { table, primaryValue, currentTable: table, ...queryPayload }
  };
}

export function buildUpdateMessage(
  table: string,
  columns: string[],
  values: string[],
  primaryValue: SqlValue,
  queryPayload: Pick<
    TableQueryPayload,
    "limit" | "offset" | "filters" | "sorters"
  >
): WorkerEvent {
  return {
    action: "update",
    payload: {
      table,
      columns,
      values,
      primaryValue,
      currentTable: table,
      ...queryPayload
    }
  };
}

export function buildInsertMessage(
  table: string,
  columns: string[],
  values: string[],
  queryPayload: Pick<
    TableQueryPayload,
    "limit" | "offset" | "filters" | "sorters"
  >
): WorkerEvent {
  return {
    action: "insert",
    payload: { table, columns, values, currentTable: table, ...queryPayload }
  };
}
