import type { QueryExecResult } from "sql.js";
import type { EditResultType, TableQueryPayload, WorkerEvent } from "@/types";
import type Sqlite from "./core";
import { CustomQueryError } from "./core";
import { arrayToCSV } from "./sqlUtils";

type WorkerPostMessage = (
  message: unknown,
  transfer?: Transferable[] | undefined
) => void;

type ExportPayload = Extract<WorkerEvent, { action: "export" }>["payload"];
type RowMutationPayload = Extract<WorkerEvent, { action: "update" }>["payload"];
type DeletePayload = Extract<WorkerEvent, { action: "delete" }>["payload"];
type InsertPayload = Extract<WorkerEvent, { action: "insert" }>["payload"];

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

function emitSchemaUpdate(postMessage: WorkerPostMessage, instance: Sqlite) {
  emit(postMessage, "updateInstance", {
    tableSchema: instance.tablesSchema,
    indexSchema: instance.indexesSchema
  });
}

function emitRowMutationComplete(
  postMessage: WorkerPostMessage,
  type: EditResultType
) {
  emit(postMessage, "updateComplete", { type });
}

function emitInsertComplete(postMessage: WorkerPostMessage) {
  emit(postMessage, "insertComplete");
}

export function emitDownloadComplete(
  postMessage: WorkerPostMessage,
  instance: Sqlite
) {
  const bytes = instance.download();
  postMessage({ action: "downloadComplete", payload: { bytes } }, [
    bytes.buffer
  ]);
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

function handleExecutionResults(
  instance: Sqlite,
  results: readonly QueryExecResult[],
  hasTablesChanged: boolean,
  payload: TableQueryPayload,
  postMessage: WorkerPostMessage
) {
  if (hasTablesChanged) {
    emitSchemaUpdate(postMessage, instance);
    return;
  }

  if (results.length > 0) {
    emit(postMessage, "customQueryComplete", { results });
    return;
  }

  const [tableResults, maxSize] = loadCurrentTable(instance, payload);
  emitQueryComplete(postMessage, tableResults, maxSize);
}

export function executeStatement(
  instance: Sqlite,
  query: string,
  payload: TableQueryPayload,
  postMessage: WorkerPostMessage
) {
  try {
    const [results, doTablesChanged] = instance.exec(query);
    handleExecutionResults(
      instance,
      results,
      doTablesChanged,
      payload,
      postMessage
    );
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
    let lastResults: QueryExecResult[] = [];

    for (const query of queries) {
      const [results, doTablesChanged] = instance.exec(query, {
        skipSchemaUpdate: true
      });
      hasTablesChanged ||= doTablesChanged;
      if (results.length > 0) {
        lastResults = results;
      }
    }

    // Single schema read after all DDL statements instead of one per statement
    if (hasTablesChanged) {
      instance.refreshSchema();
    }

    handleExecutionResults(
      instance,
      lastResults,
      hasTablesChanged,
      payload,
      postMessage
    );
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

function mutateAndRefresh(
  instance: Sqlite,
  payload: TableQueryPayload,
  postMessage: WorkerPostMessage,
  mutation: () => void,
  emitCompletion: () => void
) {
  mutation();
  emitCompletion();
  const [results, maxSize] = loadCurrentTable(instance, payload);
  emitQueryComplete(postMessage, results, maxSize);
}

export function updateRow(
  instance: Sqlite,
  payload: RowMutationPayload,
  postMessage: WorkerPostMessage
) {
  mutateAndRefresh(
    instance,
    payload,
    postMessage,
    () =>
      instance.update(
        payload.table,
        payload.columns,
        payload.values,
        payload.primaryValue
      ),
    () => emitRowMutationComplete(postMessage, "updated")
  );
}

export function deleteRow(
  instance: Sqlite,
  payload: DeletePayload,
  postMessage: WorkerPostMessage
) {
  mutateAndRefresh(
    instance,
    payload,
    postMessage,
    () => instance.delete(payload.table, payload.primaryValue),
    () => emitRowMutationComplete(postMessage, "deleted")
  );
}

export function insertRow(
  instance: Sqlite,
  payload: InsertPayload,
  postMessage: WorkerPostMessage
) {
  mutateAndRefresh(
    instance,
    payload,
    postMessage,
    () => instance.insert(payload.table, payload.columns, payload.values),
    () => emitInsertComplete(postMessage)
  );
}
