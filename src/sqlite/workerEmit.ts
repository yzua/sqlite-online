import type { QueryExecResult } from "sql.js";
import type Sqlite from "./core";
import { CustomQueryError } from "./core";
import { arrayToCSV } from "./sqlUtils";

export type WorkerPostMessage = (
  message: unknown,
  transfer?: Transferable[] | undefined
) => void;

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
  emit(postMessage, "queryComplete", {
    values: results[0]?.values ?? [],
    maxSize
  });
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
  type: "updated" | "deleted"
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
