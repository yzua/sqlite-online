import { useCallback, useEffect, useRef } from "react";
import usePanelManager from "@/hooks/usePanel";
import { useTableLimit } from "@/hooks/useTableLimit";
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

  const tableLimit = useTableLimit(currentTable);

  // Debounced fetch — only filter typing needs a delay to avoid
  // firing a query on every keystroke. Pagination, table switches,
  // sorters, and resize should fetch immediately.
  useEffect(() => {
    if (!currentTable) {
      return;
    }

    void tableLimit;
    const fetchData = (limitOverride?: number) => {
      if (!workerRef.current) {
        showToast("Worker is not initialized", "error");
        return;
      }

      const nextLimit = limitOverride ?? calculateTableLimit();

      useDatabaseStore.getState().setIsDataLoading(true);

      setLimit(nextLimit);

      postWorkerMessage(workerRef.current, {
        action: "getTableData",
        payload: {
          currentTable,
          filters,
          sorters,
          limit: nextLimit,
          offset
        }
      });
    };

    const correctionHandler =
      !filters && offset === 0
        ? setTimeout(() => {
            const correctedLimit = calculateTableLimit();

            if (correctedLimit !== useDatabaseStore.getState().limit) {
              fetchData(correctedLimit);
            }
          }, 50)
        : null;

    // Debounce only filter changes (rapid typing). Everything else
    // (pagination, table switch, sorter toggle, resize) fetches
    // immediately to avoid adding perceived latency.
    const handler = setTimeout(fetchData, filters ? 100 : 0);

    return () => {
      clearTimeout(handler);
      if (correctionHandler != null) {
        clearTimeout(correctionHandler);
      }
    };
  }, [currentTable, filters, sorters, offset, tableLimit, setLimit]);

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

  const workerApi = useWorkerActions({ workerRef });

  useWorkerHotkeys({
    handleDownload: workerApi.handleDownload,
    handleEditSubmit: workerApi.handleEditSubmit,
    handleQueryExecute: workerApi.handleQueryExecute,
    handlePageChange: workerApi.handlePageChange
  });

  return (
    <DatabaseWorkerContext.Provider value={workerApi}>
      {children}
    </DatabaseWorkerContext.Provider>
  );
};

export default DatabaseWorkerProvider;
