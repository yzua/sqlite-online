import { useCallback, useRef } from "react";
import type { SqlValue } from "sql.js";
import usePanelManager from "@/hooks/usePanel";
import { parseSqlStatements } from "@/lib/parseSqlStatements";
import showToast from "@/lib/toast";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import type { EditTypes, ExportTypes, WorkerEvent } from "@/types";
import { postWorkerMessage } from "./postWorkerMessage";
import type { DatabaseWorkerApi, PageChange } from "./types";
import {
  createNextFilters,
  createNextSorters,
  getNextPageOffset,
  getSelectedTableColumns,
  resetBrowseState
} from "./workerActionUtils";

interface UseWorkerActionsProps {
  workerRef: React.RefObject<Worker | null>;
}

function buildDeleteMessage(
  table: string,
  primaryValue: SqlValue
): WorkerEvent {
  return { action: "delete", payload: { table, primaryValue } };
}

function buildUpdateMessage(
  table: string,
  columns: string[],
  values: string[],
  primaryValue: SqlValue
): WorkerEvent {
  return {
    action: "update",
    payload: { table, columns, values, primaryValue }
  };
}

function buildInsertMessage(
  table: string,
  columns: string[],
  values: string[]
): WorkerEvent {
  return { action: "insert", payload: { table, columns, values } };
}

export function useWorkerActions({
  workerRef
}: UseWorkerActionsProps): DatabaseWorkerApi {
  const {
    setSelectedRowObject,
    setIsInserting,
    selectedRowObject,
    editValues
  } = usePanelManager();

  // Keep latest values in refs so handleEditSubmit can remain stable
  // and avoid invalidating the entire DatabaseWorkerContext on every
  // row selection or edit keystroke.
  const selectedRowObjectRef = useRef(selectedRowObject);
  selectedRowObjectRef.current = selectedRowObject;
  const editValuesRef = useRef(editValues);
  editValuesRef.current = editValues;

  const handleFileUpload = useCallback(
    (file: File) => {
      showToast("Opening database", "info");

      const reader = new FileReader();
      reader.onload = (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;

        postWorkerMessage(
          workerRef.current,
          {
            action: "openFile",
            payload: { file: arrayBuffer }
          },
          [arrayBuffer]
        );
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

      resetBrowseState(store);
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
          table: currentTable ?? "",
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
      const [query] = statements;
      postWorkerMessage(workerRef.current, {
        action: "exec",
        payload: { query: query as string, ...basePayload }
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

      const selectedRowObject = selectedRowObjectRef.current;
      const editValues = editValuesRef.current;

      if (selectedRowObject?.primaryValue == null && type !== "insert") {
        showToast(
          type === "delete"
            ? "No row selected to delete"
            : `No values provided to ${type}`,
          "error"
        );
        return;
      }

      const needsColumns = type === "update" || type === "insert";
      if (needsColumns && !store.columns) {
        showToast("No columns found", "error");
        return;
      }

      store.setIsDataLoading(true);

      const primaryValue = selectedRowObject?.primaryValue;
      let mutationMessage: WorkerEvent;
      if (type === "delete") {
        mutationMessage = buildDeleteMessage(
          currentTable,
          primaryValue as SqlValue
        );
      } else if (type === "update") {
        mutationMessage = buildUpdateMessage(
          currentTable,
          store.columns as string[],
          editValues,
          primaryValue as SqlValue
        );
      } else {
        mutationMessage = buildInsertMessage(
          currentTable,
          store.columns as string[],
          editValues
        );
      }

      const didPost = postWorkerMessage(workerRef.current, mutationMessage);
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
    [workerRef]
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
