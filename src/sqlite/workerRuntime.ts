import type { QueryExecResult } from "sql.js";
import type { TableQueryPayload, WorkerEvent } from "@/types";
import type Sqlite from "./core";
import { CustomQueryError } from "./core";
import {
  emitInsertComplete,
  emitQueryComplete,
  emitRowMutationComplete,
  emitSchemaUpdate
} from "./workerEmit";

type WorkerPostMessage = (
  message: unknown,
  transfer?: Transferable[] | undefined
) => void;

type ExportPayload = Extract<WorkerEvent, { action: "export" }>["payload"];
type RowMutationPayload = Extract<WorkerEvent, { action: "update" }>["payload"];
type DeletePayload = Extract<WorkerEvent, { action: "delete" }>["payload"];
type InsertPayload = Extract<WorkerEvent, { action: "insert" }>["payload"];

export {
  cleanupInstance,
  emitDownloadComplete,
  emitExportComplete,
  emitInitComplete,
  emitQueryComplete,
  emitQueryError
} from "./workerEmit";

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
    postMessage({ action: "customQueryComplete", payload: { results } });
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
