import { useEffect, useRef, useCallback, useState, useMemo } from "react";
import useKeyPress from "@/hooks/useKeyPress";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { usePanelStore } from "@/store/usePanelStore";
import usePanelManager from "@/hooks/usePanel";

import showToast from "@/components/common/Toaster/Toast";
import DatabaseWorkerContext from "./WorkerContext";

import type {
  EditTypes,
  exportTypes,
  Sorters,
  WorkerResponseEvent
} from "@/types";

interface DatabaseWorkerProviderProps {
  children: React.ReactNode;
}

const TABLE_ROW_HEIGHT = 33;

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
      // Create a new worker
      workerRef.current = new Worker(
        new URL("@/sqlite/sqliteWorker.ts", import.meta.url),
        { type: "module" }
      );

      // Add error handler for worker
      workerRef.current.onerror = (error) => {
        console.error("Main: Worker error:", error);
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
    workerRef.current.onmessage = (
      event: MessageEvent<WorkerResponseEvent>
    ) => {
      const workerEvent = event.data;
      const { action } = workerEvent;

      // When the worker is initialized
      if (action === "initComplete") {
        window.parent.postMessage({ type: "loadDatabaseBufferReady" }, "*");

        const { payload } = workerEvent;

        if (!payload.currentTable) {
          console.error("Main: No current table found in payload");
          setErrorMessage("No tables found in database");
          setIsDatabaseLoading(false);
          return;
        }

        setTablesSchema(payload.tableSchema);
        setIndexesSchema(payload.indexSchema);
        setCurrentTable(payload.currentTable);
        setColumns(
          payload.tableSchema[payload.currentTable].schema.map(
            (column: { name: string }) => column.name
          )
        );
        setFilters(null);
        setSorters(null);
        setSelectedRowObject(null);
        setIsInserting(false);
        setCustomQueryObject(null);
        setCustomQuery("");
        setOffset(0);
        setIsDatabaseLoading(false);
      }
      // When the query is executed and returns results
      else if (action === "queryComplete") {
        const { payload } = workerEvent;

        setMaxSize(payload.maxSize);

        const results = payload.results;
        if (!results) {
          setData(null);
        } else {
          const data = results[0]?.values || [];
          // To be able to cache the columns
          if (data.length !== 0) {
            setData(data);
          } else {
            setData(null);
          }
        }

        setIsDataLoading(false);
      }
      // When the custom query is executed and returns results
      else if (action === "customQueryComplete") {
        const { payload } = workerEvent;

        const results = payload.results;
        if (!results) {
          setData(null);
        } else {
          const data = results[0]?.values || [];
          if (data.length !== 0) {
            setCustomQueryObject({
              data: data,
              columns: results[0]?.columns || []
            });
          } else {
            setCustomQueryObject(null);
          }
        }

        setIsDataLoading(false);
        setErrorMessage(null);
      }
      // When the database is updated and requires a new schema
      else if (action === "updateInstance") {
        const { payload } = workerEvent;

        setTablesSchema(payload.tableSchema);
        setIndexesSchema(payload.indexSchema);
        setIsDataLoading(false);
        setErrorMessage(null);

        showToast("Database schema updated successfully", "success");
      }
      // When a row is updated
      else if (action === "updateComplete") {
        const { payload } = workerEvent;

        setErrorMessage(null);
        handleCloseEdit();

        showToast(`Row ${payload.type} successfully`, "success");
      }
      // When a row is inserted
      else if (action === "insertComplete") {
        setErrorMessage(null);
        handleCloseEdit();

        showToast("Row inserted successfully", "success");
      }
      // When the database is downloaded
      else if (action === "downloadComplete") {
        const { payload } = workerEvent;

        const blob = new Blob([payload.bytes], {
          type: "application/octet-stream"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "database.sqlite";
        link.click();

        showToast("Database downloaded successfully", "success");
      }
      // When the database is exported
      else if (action === "exportComplete") {
        const { payload } = workerEvent;

        const blob = new Blob([payload.results], {
          type: "text/csv"
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "export.csv";
        link.click();

        showToast("Database exported successfully", "success");
      }
      // When the worker encounters an error
      else if (action === "queryError") {
        const { payload } = workerEvent;

        console.error("Worker error:", payload.error);

        setIsDataLoading(false);

        if (payload.error.isCustomQueryError) {
          setErrorMessage(payload.error.message);
          showToast(payload.error.message, "error");
        } else {
          showToast(payload.error.message, "error");
        }
      } else {
        console.warn("Unknown action:", action);
      }
    };

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

      // Limit of the data depends on the hight of the table on the screen
      let limit = 50;
      const tableHeaderHight = document
        .getElementById("tableHeader")
        ?.getBoundingClientRect().height;
      const dataSectionHight = document
        .getElementById("dataSection")
        ?.getBoundingClientRect().height;
      const paginationControlsHight = document
        .getElementById("paginationControls")
        ?.getBoundingClientRect().height;
      if (isFirstTimeLoading) {
        setIsFirstTimeLoading(false);
        if (dataSectionHight && paginationControlsHight) {
          // 47.5 is hight of tableHeader and 33 is hight of tableRow
          // They are hardcoded because they not loaded yet
          limit = Math.floor(
            (dataSectionHight - paginationControlsHight - 47.5) /
              TABLE_ROW_HEIGHT
          );
        }
      } else if (
        tableHeaderHight &&
        dataSectionHight &&
        paginationControlsHight
      ) {
        limit = Math.floor(
          (dataSectionHight - tableHeaderHight - paginationControlsHight) /
            TABLE_ROW_HEIGHT
        );
      }

      setLimit(limit);

      // Request data from the worker
      workerRef.current.postMessage({
        action: "getTableData",
        payload: { currentTable, filters, sorters, limit, offset }
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
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === "invokeLoadDatabaseBuffer") {
        try {
          const buffer = event.data.buffer;
          await loadDatabaseBuffer(buffer); // Invoke the function
          event.source?.postMessage(
            { type: "loadDatabaseBufferSuccess" },
            event.origin as WindowPostMessageOptions
          );
        } catch (error: unknown) {
          event.source?.postMessage(
            {
              type: "loadDatabaseBufferError",
              error: (error as Error)?.message
            },
            event.origin as WindowPostMessageOptions
          );
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [loadDatabaseBuffer]);

  // Handle file upload
  const handleFileUpload = useCallback((file: File) => {
    showToast("Opening database", "info");

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;

      if (!workerRef.current) {
        showToast("Worker is not initialized", "error");
        return;
      }

      // Send the file to the worker to initialize the database
      workerRef.current.postMessage({
        action: "openFile",
        payload: { file: arrayBuffer }
      });
    };
    reader.readAsArrayBuffer(file);
  }, []);

  // Handle file upload by sending the file to the worker
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        showToast("No file selected", "error");
        return;
      }

      handleFileUpload(file);
    },
    [handleFileUpload]
  );

  // Handle when user downloads the database
  const handleDownload = useCallback(() => {
    if (!workerRef.current) {
      showToast("Worker is not initialized", "error");
      return;
    }

    // Request the worker to export and download the database
    workerRef.current.postMessage({ action: "download" });
  }, []);

  // Handle when user changes the table
  const handleTableChange = useCallback(
    (selectedTable: string) => {
      setFilters(null);
      setSorters(null);
      resetPagination();
      setMaxSize(0);
      setSelectedRowObject(null);
      setIsInserting(false);
      setCurrentTable(selectedTable);
      setColumns(tablesSchema[selectedTable].schema.map((col) => col.name));
    },
    [
      setFilters,
      setSorters,
      resetPagination,
      setMaxSize,
      setCurrentTable,
      setSelectedRowObject,
      setIsInserting,
      tablesSchema,
      setColumns
    ]
  );

  // Handle when user updates the filter
  const handleQueryFilter = useCallback(
    (column: string, value: string) => {
      const currentFilters = useDatabaseStore.getState().filters || {};
      const newFilters = { ...currentFilters, [column]: value };

      setFilters(newFilters);
      setSelectedRowObject(null);
      resetPagination();
    },
    [setFilters, setSelectedRowObject, resetPagination]
  );

  // Handle when user updates the sorter
  const handleQuerySorter = useCallback(
    (column: string) => {
      const isMutableColumns = false; // TODO: in settings tab user can change this
      const currentSorters = useDatabaseStore.getState().sorters || {};
      const currentSortOrder = currentSorters[column] || "asc";
      const newSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
      const newSorters = isMutableColumns
        ? { ...currentSorters, [column]: newSortOrder }
        : { [column]: newSortOrder };

      setSorters(newSorters as Sorters);
      setSelectedRowObject(null);
    },
    [setSorters, setSelectedRowObject]
  );

  // Handles when user changes the page
  const handlePageChange = useCallback(
    (type: "next" | "prev" | "first" | "last" | number) => {
      const currentOffset = useDatabaseStore.getState().offset;

      if (!maxSize) {
        return;
      }

      if (typeof type === "number") {
        setOffset(type);
      } else if (type === "next") {
        const toSet = currentOffset + limit;
        if (toSet >= maxSize) {
          if (maxSize - limit < 0) {
            setOffset(0);
          }
        } else {
          setOffset(toSet);
        }
      } else if (type === "prev") {
        const toSet = currentOffset - limit;
        if (toSet < 0) {
          setOffset(0);
        } else {
          setOffset(toSet);
        }
      } else if (type === "first") {
        setOffset(0);
      } else if (type === "last") {
        if (maxSize - limit < 0) {
          setOffset(0);
        } else {
          setOffset(maxSize - limit);
        }
      }

      setSelectedRowObject(null);
    },
    [maxSize, limit, setOffset, setSelectedRowObject]
  );

  // Handle when user exports the data
  const handleExport = useCallback(
    (exportType: exportTypes) => {
      if (!workerRef.current) {
        showToast("Worker is not initialized", "error");
        return;
      }

      // Request the worker to export the data
      workerRef.current.postMessage({
        action: "export",
        payload: {
          table: currentTable,
          offset,
          limit,
          filters,
          sorters,
          customQuery,
          exportType: exportType
        }
      });
    },
    [currentTable, filters, sorters, offset, limit, customQuery]
  );

  // Handle SQL statement execution by sending it to the worker
  const handleQueryExecute = useCallback(() => {
    if (!workerRef.current) {
      showToast("Worker is not initialized", "error");
      return;
    }

    const query = customQuery;
    if (!query) return;

    // Remove SQL comments before processing
    const cleanedQuery = query
      .replace(/--.*$/gm, "")
      .replace(/\/\*[\s\S]*?\*\//g, "");

    // Split the query into multiple statements
    const statements = cleanedQuery
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt !== "");

    if (statements.length === 0) return;

    setIsDataLoading(true);

    // Send all statements as a batch to improve performance
    if (statements.length === 1) {
      // Single statement - send directly
      workerRef.current.postMessage({
        action: "exec",
        payload: {
          query: statements[0],
          currentTable,
          filters,
          sorters,
          limit,
          offset
        }
      });
    } else {
      // Multiple statements - send as batch
      workerRef.current.postMessage({
        action: "execBatch",
        payload: {
          queries: statements,
          currentTable,
          filters,
          sorters,
          limit,
          offset
        }
      });
    }
  }, [
    currentTable,
    filters,
    sorters,
    limit,
    offset,
    setIsDataLoading,
    customQuery
  ]);

  // Handle when user submits the edit form
  const handleEditSubmit = useCallback(
    (type: EditTypes) => {
      if (!workerRef.current) {
        showToast("Worker is not initialized", "error");
        return;
      }

      if (!selectedRowObject?.primaryValue && type !== "insert") {
        if (type === "delete") {
          showToast("No row selected to delete", "error");
        } else {
          showToast(`No values provided to ${type}`, "error");
        }
        return;
      }

      setIsDataLoading(true);

      // Request the worker to make the changes
      workerRef.current.postMessage({
        action: type,
        payload: {
          table: currentTable,
          columns: useDatabaseStore.getState().columns,
          values: usePanelStore.getState().editValues,
          primaryValue: selectedRowObject?.primaryValue
        }
      });

      // Request the worker to refresh the current viewed data
      workerRef.current.postMessage({
        action: "refresh",
        payload: {
          currentTable: currentTable,
          offset,
          limit,
          filters,
          sorters
        }
      });
    },
    [
      currentTable,
      filters,
      sorters,
      offset,
      limit,
      setIsDataLoading,
      selectedRowObject
    ]
  );

  // Register hotkeys
  useKeyPress("ctrl+s", () => handleDownload());

  useKeyPress("ctrl+I", () => handleEditSubmit("insert"), true);
  useKeyPress("ctrl+u", () => handleEditSubmit("update"));
  useKeyPress("ctrl+d", () => handleEditSubmit("delete"));

  useKeyPress("ctrl+q", () => handleQueryExecute());

  useKeyPress("ctrl+ArrowRight", () => handlePageChange("next"));
  useKeyPress("ctrl+ArrowUp", () => handlePageChange("first"));
  useKeyPress("ctrl+ArrowDown", () => handlePageChange("last"));
  useKeyPress("ctrl+ArrowLeft", () => handlePageChange("prev"));

  const value = useMemo(
    () => ({
      workerRef,
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
      workerRef,
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
