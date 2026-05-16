import { useCallback, useEffect, useRef } from "react";
import { usePanelActions } from "@/hooks/usePanel";
import SqliteWorker from "@/sqlite/sqliteWorker.ts?worker";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { createWorkerMessageHandler } from "./handleWorkerMessage";
import { postWorkerMessage } from "./postWorkerMessage";
import { useIframeBridge } from "./useIframeBridge";
import { useTableDataFetch } from "./useTableDataFetch";
import { useWorkerActions } from "./useWorkerActions";
import { useWorkerHotkeys } from "./useWorkerHotkeys";
import DatabaseWorkerContext from "./WorkerContext";

interface DatabaseWorkerProviderProps {
  children: React.ReactNode;
}

const DatabaseWorkerProvider = ({ children }: DatabaseWorkerProviderProps) => {
  const workerRef = useRef<Worker | null>(null);

  const { handleCloseEdit, setSelectedRowObject, setIsInserting } =
    usePanelActions();

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

  useTableDataFetch(workerRef);

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
