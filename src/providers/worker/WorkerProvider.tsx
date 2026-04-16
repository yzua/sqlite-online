import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import usePanelManager from "@/hooks/usePanel";
import { calculateTableLimit } from "@/lib/calculateTableLimit";
import showToast from "@/lib/toast";
import SqliteWorker from "@/sqlite/sqliteWorker.ts?worker";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { createWorkerMessageHandler } from "./handleWorkerMessage";
import { postWorkerMessage } from "./postWorkerMessage";
import { useIframeBridge } from "./useIframeBridge";
import { useWorkerActions } from "./useWorkerActions";
import { useWorkerHotkeys } from "./useWorkerHotkeys";
import DatabaseWorkerContext from "./WorkerContext";

interface DatabaseWorkerProviderProps {
  children: React.ReactNode;
}

const DatabaseWorkerProvider = ({ children }: DatabaseWorkerProviderProps) => {
  const workerRef = useRef<Worker | null>(null);

  const currentTable = useDatabaseStore((state) => state.currentTable);
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const offset = useDatabaseStore((state) => state.offset);
  const setLimit = useDatabaseStore((state) => state.setLimit);

  const [isFirstTimeLoading, setIsFirstTimeLoading] = useState(true);
  const [viewportHeight, setViewportHeight] = useState(
    () => window.innerHeight
  );

  const { handleCloseEdit, setSelectedRowObject, setIsInserting } =
    usePanelManager();

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
        useDatabaseStore
          .getState()
          .setErrorMessage("Worker failed to initialize");
        useDatabaseStore.getState().setIsDatabaseLoading(false);
      };

      workerRef.current.onmessageerror = (error) => {
        console.error("Main: Worker message error:", error);
      };
    } catch (error) {
      console.error("Main: Failed to create worker:", error);
      useDatabaseStore.getState().setErrorMessage("Failed to create worker");
      useDatabaseStore.getState().setIsDatabaseLoading(false);
      return;
    }

    // Listen for messages from the worker
    workerRef.current.onmessage = createWorkerMessageHandler({
      handleCloseEdit,
      setSelectedRowObject,
      setIsInserting
    });

    useDatabaseStore.getState().setIsDatabaseLoading(true);

    // Request the worker to initialize the demo database
    postWorkerMessage(workerRef.current, { action: "init" });

    return () => {
      // Simple cleanup - just terminate the worker
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [handleCloseEdit, setSelectedRowObject, setIsInserting]);

  // When fetching data, ask the worker for new data
  useEffect(() => {
    const handleResize = () => {
      const nextViewportHeight = window.innerHeight;
      setViewportHeight((currentValue) =>
        currentValue === nextViewportHeight ? currentValue : nextViewportHeight
      );
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!currentTable) {
      return;
    }
    const handler = setTimeout(() => {
      if (!workerRef.current) {
        showToast("Worker is not initialized", "error");
        return;
      }

      useDatabaseStore.getState().setIsDataLoading(true);

      const limit = calculateTableLimit(isFirstTimeLoading, viewportHeight);
      if (isFirstTimeLoading) {
        setIsFirstTimeLoading(false);
      }

      setLimit(limit);

      postWorkerMessage(workerRef.current, {
        action: "getTableData",
        payload: {
          currentTable,
          filters,
          sorters,
          limit,
          offset
        }
      });
    }, 100);

    return () => clearTimeout(handler);
  }, [
    currentTable,
    filters,
    sorters,
    isFirstTimeLoading,
    offset,
    viewportHeight,
    setLimit
  ]);

  const loadDatabaseBuffer = useCallback((buffer: ArrayBuffer) => {
    postWorkerMessage(
      workerRef.current,
      {
        action: "openFile",
        payload: { file: buffer }
      },
      [buffer]
    );
  }, []);

  useIframeBridge(loadDatabaseBuffer);

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
  } = useWorkerActions({ workerRef });

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
