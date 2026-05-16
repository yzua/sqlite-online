import type { SqlValue } from "sql.js";
import { create } from "zustand";
import type {
  CustomQueryResult,
  Filters,
  IndexSchema,
  Sorters,
  TableSchema
} from "@/types";

interface DatabaseState {
  tablesSchema: TableSchema;
  indexesSchema: IndexSchema[];
  currentTable: string | null;
  data: SqlValue[][] | null;
  columns: string[] | null;
  maxSize: number;
  isDatabaseLoading: boolean;
  isDataLoading: boolean;
  errorMessage: string | null;
  filters: Filters;
  sorters: Sorters;
  limit: number;
  offset: number;
  customQuery: string;
  customQueryObject: CustomQueryResult | null;
}

interface DatabaseActions {
  setIsDatabaseLoading: (loading: boolean) => void;
  setIsDataLoading: (loading: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setFilters: (filters: Filters) => void;
  setSorters: (sorters: Sorters) => void;
  setOffset: (offset: number | ((currentOffset: number) => number)) => void;
  setCustomQuery: (query: string) => void;
  // Compound actions for grouped state transitions
  applyInit: (
    tableSchema: TableSchema,
    indexSchema: IndexSchema[],
    currentTable: string,
    columns: string[] | null
  ) => void;
  applySchemaUpdate: (
    tableSchema: TableSchema,
    indexSchema: IndexSchema[]
  ) => void;
  applyQueryResults: (data: SqlValue[][] | null, maxSize: number) => void;
  applyCustomQueryResults: (obj: CustomQueryResult | null) => void;
  clearDataLoading: () => void;
  clearDataLoadingAndError: () => void;
}

type DatabaseStore = DatabaseState & DatabaseActions;

export const useDatabaseStore = create<DatabaseStore>((set) => ({
  // --- State ---
  tablesSchema: {} as TableSchema,
  indexesSchema: [],
  currentTable: null,
  data: null,
  columns: null,
  maxSize: 1,
  isDatabaseLoading: false,
  isDataLoading: false,
  errorMessage: null,
  filters: null,
  sorters: null,
  limit: 50,
  offset: 0,
  customQuery: "",
  customQueryObject: null,

  // --- Actions ---
  setIsDatabaseLoading: (loading) => set({ isDatabaseLoading: loading }),
  setIsDataLoading: (loading) => set({ isDataLoading: loading }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setFilters: (filters) => set({ filters }),
  setSorters: (sorters) => set({ sorters }),
  setOffset: (offset) =>
    set((state) => ({
      offset: typeof offset === "function" ? offset(state.offset) : offset
    })),
  setCustomQuery: (query) => set({ customQuery: query }),

  // --- Compound actions ---
  applyInit: (tableSchema, indexSchema, currentTable, columns) =>
    set({
      tablesSchema: tableSchema,
      indexesSchema: indexSchema,
      currentTable,
      columns,
      filters: null,
      sorters: null,
      offset: 0,
      customQueryObject: null,
      customQuery: "",
      isDatabaseLoading: false
    }),
  applySchemaUpdate: (tableSchema, indexSchema) =>
    set({
      tablesSchema: tableSchema,
      indexesSchema: indexSchema,
      isDataLoading: false,
      errorMessage: null
    }),
  applyQueryResults: (data, maxSize) =>
    set({ data, maxSize, isDataLoading: false }),
  applyCustomQueryResults: (obj) =>
    set({ customQueryObject: obj, errorMessage: null, isDataLoading: false }),
  clearDataLoading: () => set({ isDataLoading: false }),
  clearDataLoadingAndError: () =>
    set({ isDataLoading: false, errorMessage: null })
}));

export const selectIsCurrentTableView = (state: DatabaseState): boolean =>
  state.currentTable != null &&
  state.tablesSchema[state.currentTable]?.type === "view";

export const selectBrowseTableState = (state: DatabaseState) => {
  const currentTableSchema = state.currentTable
    ? state.tablesSchema[state.currentTable]
    : undefined;

  return {
    data: state.data,
    columns: state.columns,
    currentTable: state.currentTable,
    currentTableSchema,
    filters: state.filters,
    sorters: state.sorters
  };
};

export const selectExecuteViewState = (state: DatabaseState) => ({
  errorMessage: state.errorMessage,
  isDataLoading: state.isDataLoading,
  isDatabaseLoading: state.isDatabaseLoading,
  customQuery: state.customQuery,
  customQueryObject: state.customQueryObject
});

export const selectPaginationState = (state: DatabaseState) => ({
  offset: state.offset,
  limit: state.limit,
  maxSize: state.maxSize,
  isDataLoading: state.isDataLoading
});
