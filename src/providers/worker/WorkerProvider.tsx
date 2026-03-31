import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import showToast from "@/components/common/Toaster/Toast";
import usePanelManager from "@/hooks/usePanel";
import SqliteWorker from "@/sqlite/sqliteWorker.ts?worker";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { calculateTableLimit } from "./calculateTableLimit";
import { createWorkerMessageHandler } from "./handleWorkerMessage";
import { postWorkerMessage } from "./postWorkerMessage";
import { useWorkerActions } from "./useWorkerActions";
import { useWorkerHotkeys } from "./useWorkerHotkeys";
import DatabaseWorkerContext from "./WorkerContext";
import { createTableQueryPayload } from "./workerActionUtils";

interface DatabaseWorkerProviderProps {
  children: React.ReactNode;
}

const DatabaseWorkerProvider = ({ children }: DatabaseWorkerProviderProps) => {
  const workerRef = useRef<Worker | null>(null);

  const setTablesSchema = useDatabaseStore((state) => state.setTablesSchema);
  const setIndexesSchema = useDatabaseStore((state) => state.setIndexesSchema);
  const setCurrentTable = useDatabaseStore((state) => state.setCurrentTable);
  const setData = useDatabaseStore((state) => state.setData);
  const setCustomQuery = useDatabaseStore((state) => state.setCustomQuery);
  const setColumns = useDatabaseStore((state) => state.setColumns);
  const setMaxSize = useDatabaseStore((state) => state.setMaxSize);
  const setIsDatabaseLoading = useDatabaseStore(
    (state) => state.setIsDatabaseLoading
  );
  const setIsDataLoading = useDatabaseStore((state) => state.setIsDataLoading);
  const setErrorMessage = useDatabaseStore((state) => state.setErrorMessage);
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const limit = useDatabaseStore((state) => state.limit);
  const offset = useDatabaseStore((state) => state.offset);
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const maxSize = useDatabaseStore((state) => state.maxSize);
  const setOffset = useDatabaseStore((state) => state.setOffset);
  const setFilters = useDatabaseStore((state) => state.setFilters);
  const setSorters = useDatabaseStore((state) => state.setSorters);
  const setLimit = useDatabaseStore((state) => state.setLimit);
  const resetPagination = useDatabaseStore((state) => state.resetPagination);
  const setCustomQueryObject = useDatabaseStore(
    (state) => state.setCustomQueryObject
  );
  const customQuery = useDatabaseStore((state) => state.customQuery);
  const tablesSchema = useDatabaseStore((state) => state.tablesSchema);

  const {
    selectedRowObject,
    setSelectedRowObject,
    setIsInserting,
    handleCloseEdit
  } = usePanelManager();

  const [isFirstTimeLoading, setIsFirstTimeLoading] = useState(true);

  // Initialize worker and send initial "init" message
  useEffect(() => {
    try {
      workerRef.current = new SqliteWorker();

      // Add error handler for worker
      workerRef.current.onerror = (error) => {
        console.error("Main: Worker error:", {
          message: error.message,
          filename: error.filename,
          lineno: error.lineno,
          colno: error.colno,
          error
        });
        setErrorMessage("Worker failed to initialize");
        setIsDatabaseLoading(false);
      };

      workerRef.current.onmessageerror = (error) => {
        console.error("Main: Worker message error:", error);
      };
    } catch (error) {
      console.error("Main: Failed to create worker:", error);
      setErrorMessage("Failed to create worker");
      setIsDatabaseLoading(false);
      return;
    }

    // Listen for messages from the worker
    workerRef.current.onmessage = createWorkerMessageHandler({
      setTablesSchema,
      setIndexesSchema,
      setCurrentTable,
      setData,
      setColumns,
      setMaxSize,
      setIsDatabaseLoading,
      setIsDataLoading,
      setErrorMessage,
      setFilters,
      setSorters,
      setOffset,
      setCustomQuery,
      setCustomQueryObject,
      handleCloseEdit,
      setSelectedRowObject,
      setIsInserting
    });

    setIsDatabaseLoading(true);

    // Request the worker to initialize the demo database
    workerRef.current.postMessage({ action: "init" });

    return () => {
      // Simple cleanup - just terminate the worker
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [
    setColumns,
    setOffset,
    setIsDatabaseLoading,
    setTablesSchema,
    setCurrentTable,
    setIndexesSchema,
    setCustomQueryObject,
    setData,
    setMaxSize,
    setIsDataLoading,
    setErrorMessage,
    setFilters,
    setSorters,
    setSelectedRowObject,
    handleCloseEdit,
    setIsInserting,
    setCustomQuery
  ]);

  // When fetching data, ask the worker for new data
  useEffect(() => {
    if (!currentTable) {
      return;
    }
    const handler = setTimeout(() => {
      if (!workerRef.current) {
        showToast("Worker is not initialized", "error");
        return;
      }

      setIsDataLoading(true);

      const limit = calculateTableLimit(isFirstTimeLoading);
      if (isFirstTimeLoading) {
        setIsFirstTimeLoading(false);
      }

      setLimit(limit);

      postWorkerMessage(workerRef.current, {
        action: "getTableData",
        payload: createTableQueryPayload({
          currentTable,
          filters,
          sorters,
          limit,
          offset
        })
      });
    }, 100);

    return () => clearTimeout(handler);
  }, [
    currentTable,
    filters,
    sorters,
    isFirstTimeLoading,
    offset,
    setLimit,
    setIsDataLoading
  ]);

  const loadDatabaseBuffer = useCallback(async (buffer: ArrayBuffer) => {
    workerRef.current?.postMessage({
      action: "openFile",
      payload: { file: buffer }
    });
  }, []);

  useEffect(() => {
    window.loadDatabaseBuffer = loadDatabaseBuffer;
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "invokeLoadDatabaseBuffer") {
        const buffer = event.data.buffer;
        void loadDatabaseBuffer(buffer)
          .then(() => {
            event.source?.postMessage(
              { type: "loadDatabaseBufferSuccess" },
              event.origin as WindowPostMessageOptions
            );
          })
          .catch((error: unknown) => {
            event.source?.postMessage(
              {
                type: "loadDatabaseBufferError",
                error: error instanceof Error ? error.message : String(error)
              },
              event.origin as WindowPostMessageOptions
            );
          });
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [loadDatabaseBuffer]);

  const {
    handleFileUpload,
    handleFileChange,
    handleDownload,
    handleTableChange,
    handleQueryFilter,
    handleQuerySorter,
    handlePageChange,
    handleExport,
    handleQueryExecute,
    handleEditSubmit
  } = useWorkerActions({
    workerRef,
    currentTable,
    tablesSchema,
    filters,
    sorters,
    limit,
    offset,
    maxSize,
    customQuery,
    selectedRowObject,
    setCurrentTable,
    setColumns,
    setFilters,
    setSorters,
    setOffset,
    setMaxSize,
    setIsDataLoading,
    resetPagination,
    setSelectedRowObject,
    setIsInserting
  });

  useWorkerHotkeys({
    handleDownload,
    handleEditSubmit,
    handleQueryExecute,
    handlePageChange
  });

  const value = useMemo(
    () => ({
      handleFileUpload,
      handleFileChange,
      handleDownload,
      handleTableChange,
      handleQueryFilter,
      handleQuerySorter,
      handlePageChange,
      handleExport,
      handleQueryExecute,
      handleEditSubmit
    }),
    [
      handleFileUpload,
      handleFileChange,
      handleDownload,
      handleTableChange,
      handleQueryFilter,
      handleQuerySorter,
      handlePageChange,
      handleExport,
      handleQueryExecute,
      handleEditSubmit
    ]
  );

  return (
    <DatabaseWorkerContext.Provider value={value}>
      {children}
    </DatabaseWorkerContext.Provider>
  );
};

export default DatabaseWorkerProvider;
