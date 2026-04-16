import { useCallback } from "react";
import showToast from "@/components/common/Toaster/Toast";
import usePanelManager from "@/hooks/usePanel";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import type { EditTypes, ExportTypes } from "@/types";
import { parseSqlStatements } from "./parseSqlStatements";
import { postWorkerMessage } from "./postWorkerMessage";
import type { DatabaseWorkerApi, PageChange } from "./types";
import {
  createNextFilters,
  createNextSorters,
  getNextPageOffset,
  getSelectedTableColumns
} from "./workerActionUtils";

interface UseWorkerActionsProps {
  workerRef: React.RefObject<Worker | null>;
}

export function useWorkerActions({
  workerRef
}: UseWorkerActionsProps): DatabaseWorkerApi {
  const {
    selectedRowObject,
    setSelectedRowObject,
    setIsInserting,
    editValues
  } = usePanelManager();

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
      const { tablesSchema, ...store } = useDatabaseStore.getState();
      const selectedTableSchema = tablesSchema[selectedTable];
      if (!selectedTableSchema) {
        showToast("Selected table schema not found", "error");
        return;
      }

      store.setFilters(null);
      store.setSorters(null);
      store.resetPagination();
      store.setMaxSize(0);
      setSelectedRowObject(null);
      setIsInserting(false);
      store.setCurrentTable(selectedTable);
      store.setColumns(getSelectedTableColumns(tablesSchema, selectedTable));
    },
    [setSelectedRowObject, setIsInserting]
  );

  const handleQueryFilter = useCallback(
    (column: string, value: string) => {
      const { filters, ...store } = useDatabaseStore.getState();
      store.setFilters(createNextFilters(filters, column, value));
      setSelectedRowObject(null);
      store.resetPagination();
    },
    [setSelectedRowObject]
  );

  const handleQuerySorter = useCallback(
    (column: string) => {
      const store = useDatabaseStore.getState();
      store.setSorters(createNextSorters(store.sorters, column));
      setSelectedRowObject(null);
    },
    [setSelectedRowObject]
  );

  const handlePageChange = useCallback(
    (type: PageChange) => {
      const { maxSize, limit, ...store } = useDatabaseStore.getState();
      if (!maxSize) {
        return;
      }

      store.setOffset((previousOffset) =>
        getNextPageOffset(type, previousOffset, limit, maxSize)
      );
      setSelectedRowObject(null);
    },
    [setSelectedRowObject]
  );

  const handleExport = useCallback(
    (exportType: ExportTypes) => {
      const { currentTable, offset, limit, filters, sorters, customQuery } =
        useDatabaseStore.getState();
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
    [workerRef]
  );

  const handleQueryExecute = useCallback(() => {
    if (!workerRef.current) {
      showToast("Worker is not initialized", "error");
      return;
    }

    const { currentTable, customQuery, filters, sorters, limit, offset } =
      useDatabaseStore.getState();
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

    useDatabaseStore.getState().setIsDataLoading(true);

    const basePayload = {
      currentTable,
      filters,
      sorters,
      limit,
      offset
    };

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
  }, [workerRef]);

  const handleEditSubmit = useCallback(
    (type: EditTypes) => {
      const { currentTable, ...store } = useDatabaseStore.getState();
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

      store.setIsDataLoading(true);

      const didPost = postWorkerMessage(workerRef.current, {
        action: type,
        payload: {
          table: currentTable,
          columns: store.columns,
          values: editValues,
          primaryValue: selectedRowObject?.primaryValue
        }
      });

      if (!didPost) {
        store.setIsDataLoading(false);
        return;
      }

      postWorkerMessage(workerRef.current, {
        action: "refresh",
        payload: {
          currentTable,
          offset: store.offset,
          limit: store.limit,
          filters: store.filters,
          sorters: store.sorters
        }
      });
    },
    [workerRef, selectedRowObject, editValues]
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
