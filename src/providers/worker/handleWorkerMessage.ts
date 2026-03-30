import showToast from "@/components/common/Toaster/Toast";
import type { WorkerResponseEvent } from "@/types";

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
  setTablesSchema: (schema: import("@/types").TableSchema) => void;
  setIndexesSchema: (schema: import("@/types").IndexSchema[]) => void;
  setCurrentTable: (table: string | null) => void;
  setData: (data: import("sql.js").SqlValue[][] | null) => void;
  setColumns: (columns: string[] | null) => void;
  setMaxSize: (size: number) => void;
  setIsDatabaseLoading: (loading: boolean) => void;
  setIsDataLoading: (loading: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setFilters: (filters: import("@/types").Filters) => void;
  setSorters: (sorters: import("@/types").Sorters) => void;
  setOffset: (offset: number) => void;
  setCustomQuery: (query: string) => void;
  setCustomQueryObject: (
    obj: { data: import("sql.js").SqlValue[][]; columns: string[] } | null
  ) => void;
  handleCloseEdit: () => void;
  setSelectedRowObject: (value: null) => void;
  setIsInserting: (value: boolean) => void;
}

export function createWorkerMessageHandler(actions: WorkerMessageActions) {
  return (event: MessageEvent<WorkerResponseEvent>) => {
    const workerEvent = event.data;
    const { action } = workerEvent;

    if (action === "initComplete") {
      window.parent.postMessage({ type: "loadDatabaseBufferReady" }, "*");

      const { payload } = workerEvent;

      if (!payload.currentTable) {
        console.error("Main: No current table found in payload");
        actions.setErrorMessage("No tables found in database");
        actions.setIsDatabaseLoading(false);
        return;
      }

      const currentTableSchema = payload.tableSchema[payload.currentTable];
      if (!currentTableSchema) {
        console.error("Main: Current table schema not found in payload");
        actions.setErrorMessage("Unable to load the current table schema");
        actions.setIsDatabaseLoading(false);
        return;
      }

      actions.setTablesSchema(payload.tableSchema);
      actions.setIndexesSchema(payload.indexSchema);
      actions.setCurrentTable(payload.currentTable);
      actions.setColumns(
        currentTableSchema.schema.map((column) => column.name)
      );
      actions.setFilters(null);
      actions.setSorters(null);
      actions.setSelectedRowObject(null);
      actions.setIsInserting(false);
      actions.setCustomQueryObject(null);
      actions.setCustomQuery("");
      actions.setOffset(0);
      actions.setIsDatabaseLoading(false);
    } else if (action === "queryComplete") {
      const { payload } = workerEvent;

      actions.setMaxSize(payload.maxSize);

      const results = payload.results;
      if (!results) {
        actions.setData(null);
      } else {
        const data = results[0]?.values || [];
        if (data.length !== 0) {
          actions.setData(data);
        } else {
          actions.setData(null);
        }
      }

      actions.setIsDataLoading(false);
    } else if (action === "customQueryComplete") {
      const { payload } = workerEvent;

      const results = payload.results;
      if (!results) {
        actions.setData(null);
      } else {
        const data = results[0]?.values || [];
        if (data.length !== 0) {
          actions.setCustomQueryObject({
            data: data,
            columns: results[0]?.columns || []
          });
        } else {
          actions.setCustomQueryObject(null);
        }
      }

      actions.setIsDataLoading(false);
      actions.setErrorMessage(null);
    } else if (action === "updateInstance") {
      const { payload } = workerEvent;

      actions.setTablesSchema(payload.tableSchema);
      actions.setIndexesSchema(payload.indexSchema);
      actions.setIsDataLoading(false);
      actions.setErrorMessage(null);

      showToast("Database schema updated successfully", "success");
    } else if (action === "updateComplete") {
      const { payload } = workerEvent;

      actions.setErrorMessage(null);
      actions.handleCloseEdit();

      showToast(`Row ${payload.type} successfully`, "success");
    } else if (action === "insertComplete") {
      actions.setErrorMessage(null);
      actions.handleCloseEdit();

      showToast("Row inserted successfully", "success");
    } else if (action === "downloadComplete") {
      const { payload } = workerEvent;

      triggerDownload(
        payload.bytes,
        "database.sqlite",
        "application/octet-stream"
      );

      showToast("Database downloaded successfully", "success");
    } else if (action === "exportComplete") {
      const { payload } = workerEvent;

      triggerDownload(payload.results, "export.csv", "text/csv");

      showToast("Database exported successfully", "success");
    } else if (action === "queryError") {
      const { payload } = workerEvent;

      console.error("Worker error:", payload.error);

      actions.setIsDataLoading(false);

      if (payload.error.isCustomQueryError) {
        actions.setErrorMessage(payload.error.message);
      }
      showToast(payload.error.message, "error");
    } else {
      console.warn("Unknown action:", action);
    }
  };
}
