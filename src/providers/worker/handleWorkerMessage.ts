import type { QueryExecResult } from "sql.js";
import showToast from "@/components/common/toast";
import { triggerDownload } from "@/lib/download";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import type { WorkerResponseEvent } from "@/types/worker-protocol";
import { getSelectedTableColumns } from "./workerActionUtils";

export interface SideEffects {
  handleCloseEdit: () => void;
  setSelectedRowObject: (value: null) => void;
  setIsInserting: (value: boolean) => void;
  showToast: typeof showToast;
  triggerDownload: typeof triggerDownload;
  postReadyToParent: () => void;
}

function getResultRows(results?: QueryExecResult[]) {
  return results?.[0]?.values || [];
}

function resetTableViewState(fx: SideEffects) {
  fx.setSelectedRowObject(null);
  fx.setIsInserting(false);
}

function handleInitComplete(
  payload: Extract<WorkerResponseEvent, { action: "initComplete" }>["payload"],
  fx: SideEffects
) {
  fx.postReadyToParent();

  if (!payload.currentTable) {
    console.error("Main: No current table found in payload");
    const store = useDatabaseStore.getState();
    store.setErrorMessage("No tables found in database");
    store.setIsDatabaseLoading(false);
    return;
  }

  const currentTableSchema = payload.tableSchema[payload.currentTable];
  if (!currentTableSchema) {
    console.error("Main: Current table schema not found in payload");
    const store = useDatabaseStore.getState();
    store.setErrorMessage("Unable to load the current table schema");
    store.setIsDatabaseLoading(false);
    return;
  }

  useDatabaseStore
    .getState()
    .applyInit(
      payload.tableSchema,
      payload.indexSchema,
      payload.currentTable,
      getSelectedTableColumns(payload.tableSchema, payload.currentTable)
    );
  resetTableViewState(fx);
}

function handleQueryComplete(
  payload: Extract<WorkerResponseEvent, { action: "queryComplete" }>["payload"]
) {
  const data = payload.values;
  useDatabaseStore
    .getState()
    .applyQueryResults(data.length > 0 ? data : null, payload.maxSize);
}

function handleCustomQueryComplete(
  payload: Extract<
    WorkerResponseEvent,
    { action: "customQueryComplete" }
  >["payload"]
) {
  const data = getResultRows(payload.results);
  useDatabaseStore
    .getState()
    .applyCustomQueryResults(
      data.length > 0
        ? { data, columns: payload.results[0]?.columns || [] }
        : null
    );
}

function handleUpdateInstance(
  payload: Extract<
    WorkerResponseEvent,
    { action: "updateInstance" }
  >["payload"],
  fx: SideEffects
) {
  useDatabaseStore
    .getState()
    .applySchemaUpdate(payload.tableSchema, payload.indexSchema);
  fx.showToast("Database schema updated successfully", "success");
}

function handleUpdateComplete(
  payload: Extract<
    WorkerResponseEvent,
    { action: "updateComplete" }
  >["payload"],
  fx: SideEffects
) {
  useDatabaseStore.getState().clearDataLoadingAndError();
  fx.handleCloseEdit();
  fx.showToast(`Row ${payload.type} successfully`, "success");
}

function handleInsertComplete(fx: SideEffects) {
  useDatabaseStore.getState().clearDataLoadingAndError();
  fx.handleCloseEdit();
  fx.showToast("Row inserted successfully", "success");
}

function handleDownloadComplete(
  payload: Extract<
    WorkerResponseEvent,
    { action: "downloadComplete" }
  >["payload"],
  fx: SideEffects
) {
  fx.triggerDownload(
    payload.bytes,
    "database.sqlite",
    "application/octet-stream"
  );
  fx.showToast("Database downloaded successfully", "success");
}

function handleExportComplete(
  payload: Extract<
    WorkerResponseEvent,
    { action: "exportComplete" }
  >["payload"],
  fx: SideEffects
) {
  fx.triggerDownload(payload.results, "export.csv", "text/csv");
  fx.showToast("Database exported successfully", "success");
}

function handleQueryError(
  payload: Extract<WorkerResponseEvent, { action: "queryError" }>["payload"]
) {
  console.error("Worker error:", payload.error);
  const store = useDatabaseStore.getState();
  store.clearDataLoading();
  if (payload.error.isCustomQueryError) {
    store.setErrorMessage(payload.error.message);
  }
  showToast(payload.error.message, "error");
}

// biome-ignore lint/suspicious/noExplicitAny: handler map dispatches union-typed payloads
type ResponseHandler = (payload: any, fx: SideEffects) => void;

const responseHandlers: Record<string, ResponseHandler> = {
  initComplete: (payload, fx) => handleInitComplete(payload, fx),
  queryComplete: (payload) => handleQueryComplete(payload),
  customQueryComplete: (payload) => handleCustomQueryComplete(payload),
  updateInstance: (payload, fx) => handleUpdateInstance(payload, fx),
  updateComplete: (payload, fx) => handleUpdateComplete(payload, fx),
  insertComplete: (_payload, fx) => handleInsertComplete(fx),
  downloadComplete: (payload, fx) => handleDownloadComplete(payload, fx),
  exportComplete: (payload, fx) => handleExportComplete(payload, fx),
  queryError: (payload) => handleQueryError(payload)
};

export function createWorkerMessageHandler(actions: {
  handleCloseEdit: () => void;
  setSelectedRowObject: (value: null) => void;
  setIsInserting: (value: boolean) => void;
}) {
  const fx: SideEffects = {
    ...actions,
    showToast,
    triggerDownload,
    postReadyToParent: () => {
      window.parent.postMessage({ type: "loadDatabaseBufferReady" }, "*");
    }
  };

  return (event: MessageEvent<WorkerResponseEvent>) => {
    const { action, payload } = event.data;
    const handler = responseHandlers[action];
    if (handler) {
      handler(payload, fx);
    } else {
      const _exhaustive: never = event.data;
      console.warn(
        "Unknown action:",
        (_exhaustive as { action: string }).action
      );
    }
  };
}
