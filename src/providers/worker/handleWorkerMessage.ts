import type { QueryExecResult } from "sql.js";
import showToast from "@/lib/toast";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import type { WorkerResponseEvent } from "@/types";
import { getSelectedTableColumns } from "./workerActionUtils";

function triggerDownload(
  data: ArrayBuffer | string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

interface WorkerMessageActions {
  handleCloseEdit: () => void;
  setSelectedRowObject: (value: null) => void;
  setIsInserting: (value: boolean) => void;
}

function getResultRows(results?: QueryExecResult[]) {
  return results?.[0]?.values || [];
}

function resetTableViewState(actions: WorkerMessageActions) {
  actions.setSelectedRowObject(null);
  actions.setIsInserting(false);
}

export function createWorkerMessageHandler(actions: WorkerMessageActions) {
  return (event: MessageEvent<WorkerResponseEvent>) => {
    const workerEvent = event.data;
    const { action } = workerEvent;
    const store = useDatabaseStore.getState();

    switch (action) {
      case "initComplete": {
        window.parent.postMessage({ type: "loadDatabaseBufferReady" }, "*");

        const { payload } = workerEvent;

        if (!payload.currentTable) {
          console.error("Main: No current table found in payload");
          store.setErrorMessage("No tables found in database");
          store.setIsDatabaseLoading(false);
          return;
        }

        const currentTableSchema = payload.tableSchema[payload.currentTable];
        if (!currentTableSchema) {
          console.error("Main: Current table schema not found in payload");
          store.setErrorMessage("Unable to load the current table schema");
          store.setIsDatabaseLoading(false);
          return;
        }

        store.applyInit(
          payload.tableSchema,
          payload.indexSchema,
          payload.currentTable,
          getSelectedTableColumns(payload.tableSchema, payload.currentTable)
        );
        resetTableViewState(actions);
        break;
      }

      case "queryComplete": {
        const { payload } = workerEvent;
        const data = getResultRows(payload.results);
        store.applyQueryResults(data.length > 0 ? data : null, payload.maxSize);
        break;
      }

      case "customQueryComplete": {
        const { payload } = workerEvent;
        const data = getResultRows(payload.results);
        store.applyCustomQueryResults(
          data.length > 0
            ? { data, columns: payload.results[0]?.columns || [] }
            : null
        );
        break;
      }

      case "updateInstance": {
        const { payload } = workerEvent;
        store.applySchemaUpdate(payload.tableSchema, payload.indexSchema);
        showToast("Database schema updated successfully", "success");
        break;
      }

      case "updateComplete": {
        const { payload } = workerEvent;
        store.clearDataLoadingAndError();
        actions.handleCloseEdit();
        showToast(`Row ${payload.type} successfully`, "success");
        break;
      }

      case "insertComplete": {
        store.clearDataLoadingAndError();
        actions.handleCloseEdit();
        showToast("Row inserted successfully", "success");
        break;
      }

      case "downloadComplete": {
        const { payload } = workerEvent;
        triggerDownload(
          payload.bytes,
          "database.sqlite",
          "application/octet-stream"
        );
        showToast("Database downloaded successfully", "success");
        break;
      }

      case "exportComplete": {
        const { payload } = workerEvent;
        triggerDownload(payload.results, "export.csv", "text/csv");
        showToast("Database exported successfully", "success");
        break;
      }

      case "queryError": {
        const { payload } = workerEvent;
        console.error("Worker error:", payload.error);
        store.clearDataLoading();
        if (payload.error.isCustomQueryError) {
          store.setErrorMessage(payload.error.message);
        }
        showToast(payload.error.message, "error");
        break;
      }

      default: {
        const _exhaustive: never = workerEvent;
        console.warn(
          "Unknown action:",
          (_exhaustive as { action: string }).action
        );
      }
    }
  };
}
