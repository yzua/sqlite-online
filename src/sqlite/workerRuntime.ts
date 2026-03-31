import type { QueryExecResult, SqlValue } from "sql.js";
import type {
  EditResultType,
  Filters,
  Sorters,
  TableQueryPayload
} from "@/types";
import type Sqlite from "./core";
import { arrayToCSV, CustomQueryError } from "./core";

type WorkerPostMessage = (message: unknown) => void;

interface ExportPayload {
  table: string;
  filters: Filters;
  sorters: Sorters;
  limit: number;
  offset: number;
  customQuery: string;
  exportType: "table" | "current" | "custom";
}

interface RowMutationPayload {
  table: string;
  columns: string[];
  values: SqlValue[];
  primaryValue: SqlValue;
}

type DeletePayload = Pick<RowMutationPayload, "table" | "primaryValue">;
type InsertPayload = Pick<RowMutationPayload, "table" | "columns" | "values">;

function emit(
  postMessage: WorkerPostMessage,
  action: string,
  payload?: unknown
) {
  postMessage(payload === undefined ? { action } : { action, payload });
}

export function cleanupInstance(instance: Sqlite | null) {
  if (!instance) {
    return null;
  }

  try {
    if (typeof instance.db.close === "function") {
      instance.db.close();
    }
  } catch (error) {
    console.warn("Error during database cleanup:", error);
  }

  return null;
}

export function emitInitComplete(
  postMessage: WorkerPostMessage,
  instance: Sqlite
) {
  emit(postMessage, "initComplete", {
    tableSchema: instance.tablesSchema,
    indexSchema: instance.indexesSchema,
    currentTable: instance.firstTable
  });
}

export function emitQueryComplete(
  postMessage: WorkerPostMessage,
  results: readonly QueryExecResult[],
  maxSize: number
) {
  emit(postMessage, "queryComplete", { results, maxSize });
}

export function emitSchemaUpdate(
  postMessage: WorkerPostMessage,
  instance: Sqlite
) {
  emit(postMessage, "updateInstance", {
    tableSchema: instance.tablesSchema,
    indexSchema: instance.indexesSchema
  });
}

export function emitRowMutationComplete(
  postMessage: WorkerPostMessage,
  type: EditResultType
) {
  emit(postMessage, "updateComplete", { type });
}

export function emitInsertComplete(postMessage: WorkerPostMessage) {
  emit(postMessage, "insertComplete");
}

export function emitDownloadComplete(
  postMessage: WorkerPostMessage,
  instance: Sqlite
) {
  emit(postMessage, "downloadComplete", { bytes: instance.download() });
}

export function emitExportComplete(
  postMessage: WorkerPostMessage,
  results: readonly QueryExecResult[]
) {
  const firstResult = results[0];
  emit(postMessage, "exportComplete", {
    results: firstResult
      ? arrayToCSV(firstResult.columns, firstResult.values)
      : ""
  });
}

export function emitQueryError(postMessage: WorkerPostMessage, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  emit(postMessage, "queryError", {
    error: {
      message,
      isCustomQueryError: error instanceof CustomQueryError
    }
  });
}

export function loadCurrentTable(instance: Sqlite, payload: TableQueryPayload) {
  return instance.getTableData(
    payload.currentTable,
    payload.limit,
    payload.offset,
    payload.filters,
    payload.sorters
  );
}

export function executeStatement(
  instance: Sqlite,
  query: string,
  payload: TableQueryPayload,
  postMessage: WorkerPostMessage
) {
  try {
    const [results, doTablesChanged] = instance.exec(query);
    if (doTablesChanged) {
      emitSchemaUpdate(postMessage, instance);
      return;
    }

    if (results.length > 0) {
      emit(postMessage, "customQueryComplete", { results });
      return;
    }

    const [tableResults, maxSize] = loadCurrentTable(instance, payload);
    emitQueryComplete(postMessage, tableResults, maxSize);
  } catch (error) {
    if (error instanceof Error) {
      throw new CustomQueryError(error.message);
    }
  }
}

export function executeBatchStatements(
  instance: Sqlite,
  queries: string[],
  payload: TableQueryPayload,
  postMessage: WorkerPostMessage
) {
  try {
    let hasTablesChanged = false;
    let lastResults: QueryExecResult[] | null = null;

    for (const query of queries) {
      const [results, doTablesChanged] = instance.exec(query);
      hasTablesChanged ||= doTablesChanged;
      if (results.length > 0) {
        lastResults = results;
      }
    }

    if (hasTablesChanged) {
      emitSchemaUpdate(postMessage, instance);
      return;
    }

    if (lastResults && lastResults.length > 0) {
      emit(postMessage, "customQueryComplete", { results: lastResults });
      return;
    }

    const [tableResults, maxSize] = loadCurrentTable(instance, payload);
    emitQueryComplete(postMessage, tableResults, maxSize);
  } catch (error) {
    if (error instanceof Error) {
      throw new CustomQueryError(error.message);
    }
  }
}

export function exportResults(instance: Sqlite, payload: ExportPayload) {
  if (payload.exportType === "table") {
    return instance.export({ table: payload.table });
  }

  if (payload.exportType === "current") {
    return instance.export({
      table: payload.table,
      limit: payload.limit,
      offset: payload.offset,
      filters: payload.filters,
      sorters: payload.sorters
    });
  }

  if (payload.exportType === "custom") {
    return instance.export({ customQuery: payload.customQuery });
  }

  throw new Error("Unknown export type");
}

export function updateRow(instance: Sqlite, payload: RowMutationPayload) {
  instance.update(
    payload.table,
    payload.columns,
    payload.values,
    payload.primaryValue
  );
}

export function deleteRow(instance: Sqlite, payload: DeletePayload) {
  instance.delete(payload.table, payload.primaryValue);
}

export function insertRow(instance: Sqlite, payload: InsertPayload) {
  instance.insert(payload.table, payload.columns, payload.values);
}
