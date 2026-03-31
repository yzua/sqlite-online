import { useCallback } from "react";
import showToast from "@/components/common/Toaster/Toast";
import type { SelectedRowObject } from "@/providers/panel/types";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { usePanelStore } from "@/store/usePanelStore";
import type { EditTypes, ExportTypes, Filters, Sorters } from "@/types";
import { parseSqlStatements } from "./parseSqlStatements";
import { postWorkerMessage } from "./postWorkerMessage";
import type { DatabaseWorkerApi, PageChange } from "./types";
import {
  createNextFilters,
  createNextSorters,
  createTableQueryPayload,
  getNextPageOffset,
  getSelectedTableColumns
} from "./workerActionUtils";

interface UseWorkerActionsProps {
  workerRef: React.RefObject<Worker | null>;
  currentTable: string | null;
  tablesSchema: import("@/types").TableSchema;
  filters: Filters;
  sorters: Sorters;
  limit: number;
  offset: number;
  maxSize: number;
  customQuery: string;
  selectedRowObject: SelectedRowObject | null;
  setCurrentTable: (table: string | null) => void;
  setColumns: (columns: string[] | null) => void;
  setFilters: (filters: Filters) => void;
  setSorters: (sorters: Sorters) => void;
  setOffset: (offset: number | ((currentOffset: number) => number)) => void;
  setMaxSize: (size: number) => void;
  setIsDataLoading: (loading: boolean) => void;
  resetPagination: () => void;
  setSelectedRowObject: (value: SelectedRowObject | null) => void;
  setIsInserting: (value: boolean) => void;
}

export function useWorkerActions({
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
}: UseWorkerActionsProps): DatabaseWorkerApi {
  const handleFileUpload = useCallback(
    (file: File) => {
      showToast("Opening database", "info");

      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;

        postWorkerMessage(workerRef.current, {
          action: "openFile",
          payload: { file: arrayBuffer }
        });
      };
      reader.readAsArrayBuffer(file);
    },
    [workerRef]
  );

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

  const handleDownload = useCallback(() => {
    postWorkerMessage(workerRef.current, { action: "download" });
  }, [workerRef]);

  const handleTableChange = useCallback(
    (selectedTable: string) => {
      const selectedTableSchema = tablesSchema[selectedTable];
      if (!selectedTableSchema) {
        showToast("Selected table schema not found", "error");
        return;
      }

      setFilters(null);
      setSorters(null);
      resetPagination();
      setMaxSize(0);
      setSelectedRowObject(null);
      setIsInserting(false);
      setCurrentTable(selectedTable);
      setColumns(getSelectedTableColumns(tablesSchema, selectedTable));
    },
    [
      tablesSchema,
      setFilters,
      setSorters,
      resetPagination,
      setMaxSize,
      setSelectedRowObject,
      setIsInserting,
      setCurrentTable,
      setColumns
    ]
  );

  const handleQueryFilter = useCallback(
    (column: string, value: string) => {
      setFilters(
        createNextFilters(useDatabaseStore.getState().filters, column, value)
      );
      setSelectedRowObject(null);
      resetPagination();
    },
    [setFilters, setSelectedRowObject, resetPagination]
  );

  const handleQuerySorter = useCallback(
    (column: string) => {
      setSorters(
        createNextSorters(useDatabaseStore.getState().sorters, column)
      );
      setSelectedRowObject(null);
    },
    [setSorters, setSelectedRowObject]
  );

  const handlePageChange = useCallback(
    (type: PageChange) => {
      if (!maxSize) {
        return;
      }

      setOffset((previousOffset) =>
        getNextPageOffset(type, previousOffset, limit, maxSize)
      );
      setSelectedRowObject(null);
    },
    [maxSize, limit, setOffset, setSelectedRowObject]
  );

  const handleExport = useCallback(
    (exportType: ExportTypes) => {
      if (!currentTable && exportType !== "custom") {
        showToast("No table selected", "error");
        return;
      }

      postWorkerMessage(workerRef.current, {
        action: "export",
        payload: {
          table: currentTable,
          offset,
          limit,
          filters,
          sorters,
          customQuery,
          exportType
        }
      });
    },
    [workerRef, currentTable, offset, limit, filters, sorters, customQuery]
  );

  const handleQueryExecute = useCallback(() => {
    if (!workerRef.current) {
      showToast("Worker is not initialized", "error");
      return;
    }

    if (!currentTable) {
      showToast("No table selected", "error");
      return;
    }

    if (!customQuery) {
      return;
    }

    const statements = parseSqlStatements(customQuery);
    if (statements.length === 0) {
      return;
    }

    setIsDataLoading(true);

    const basePayload = createTableQueryPayload({
      currentTable,
      filters,
      sorters,
      limit,
      offset
    });

    if (statements.length === 1) {
      postWorkerMessage(workerRef.current, {
        action: "exec",
        payload: { query: statements[0], ...basePayload }
      });
      return;
    }

    postWorkerMessage(workerRef.current, {
      action: "execBatch",
      payload: { queries: statements, ...basePayload }
    });
  }, [
    workerRef,
    currentTable,
    customQuery,
    setIsDataLoading,
    filters,
    sorters,
    limit,
    offset
  ]);

  const handleEditSubmit = useCallback(
    (type: EditTypes) => {
      if (!currentTable) {
        showToast("No table selected", "error");
        return;
      }

      if (selectedRowObject?.primaryValue == null && type !== "insert") {
        showToast(
          type === "delete"
            ? "No row selected to delete"
            : `No values provided to ${type}`,
          "error"
        );
        return;
      }

      setIsDataLoading(true);

      const didPost = postWorkerMessage(workerRef.current, {
        action: type,
        payload: {
          table: currentTable,
          columns: useDatabaseStore.getState().columns,
          values: usePanelStore.getState().editValues,
          primaryValue: selectedRowObject?.primaryValue
        }
      });

      if (!didPost) {
        setIsDataLoading(false);
        return;
      }

      postWorkerMessage(workerRef.current, {
        action: "refresh",
        payload: createTableQueryPayload({
          currentTable,
          offset,
          limit,
          filters,
          sorters
        })
      });
    },
    [
      workerRef,
      currentTable,
      selectedRowObject,
      setIsDataLoading,
      offset,
      limit,
      filters,
      sorters
    ]
  );

  return {
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
  };
}
