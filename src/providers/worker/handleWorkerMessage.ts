import type { QueryExecResult } from "sql.js";
import showToast from "@/components/common/Toaster/Toast";
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
  const store = useDatabaseStore.getState();
  store.setFilters(null);
  store.setSorters(null);
  store.setCustomQueryObject(null);
  store.setCustomQuery("");
  store.setOffset(0);
  actions.setSelectedRowObject(null);
  actions.setIsInserting(false);
}

function applyQueryResults(results?: QueryExecResult[]) {
  const data = getResultRows(results);
  useDatabaseStore.getState().setData(data.length > 0 ? data : null);
}

function applyCustomQueryResults(results: QueryExecResult[]) {
  const data = getResultRows(results);

  if (data.length > 0) {
    useDatabaseStore.getState().setCustomQueryObject({
      data,
      columns: results[0]?.columns || []
    });
    return;
  }

  useDatabaseStore.getState().setCustomQueryObject(null);
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

        store.setTablesSchema(payload.tableSchema);
        store.setIndexesSchema(payload.indexSchema);
        store.setCurrentTable(payload.currentTable);
        store.setColumns(
          getSelectedTableColumns(payload.tableSchema, payload.currentTable)
        );
        resetTableViewState(actions);
        store.setIsDatabaseLoading(false);
        break;
      }

      case "queryComplete": {
        const { payload } = workerEvent;

        store.setMaxSize(payload.maxSize);

        applyQueryResults(payload.results);

        store.setIsDataLoading(false);
        break;
      }

      case "customQueryComplete": {
        const { payload } = workerEvent;

        applyCustomQueryResults(payload.results);

        store.setIsDataLoading(false);
        store.setErrorMessage(null);
        break;
      }

      case "updateInstance": {
        const { payload } = workerEvent;

        store.setTablesSchema(payload.tableSchema);
        store.setIndexesSchema(payload.indexSchema);
        store.setIsDataLoading(false);
        store.setErrorMessage(null);

        showToast("Database schema updated successfully", "success");
        break;
      }

      case "updateComplete": {
        const { payload } = workerEvent;

        store.setErrorMessage(null);
        actions.handleCloseEdit();

        showToast(`Row ${payload.type} successfully`, "success");
        break;
      }

      case "insertComplete": {
        store.setErrorMessage(null);
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

        store.setIsDataLoading(false);

        if (payload.error.isCustomQueryError) {
          store.setErrorMessage(payload.error.message);
        }
        showToast(payload.error.message, "error");
        break;
      }

      default:
        console.warn("Unknown action:", action);
    }
  };
}
