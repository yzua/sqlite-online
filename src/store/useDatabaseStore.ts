import type { SqlValue } from "sql.js";
import { create } from "zustand";
import { loadApiKey, storeApiKey } from "@/lib/apiKeyStorage";
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
  geminiApiKey: string | null;
  isAiLoading: boolean;
}

interface DatabaseActions {
  setTablesSchema: (schema: TableSchema) => void;
  setIndexesSchema: (schema: IndexSchema[]) => void;
  setCurrentTable: (table: string | null) => void;
  setData: (data: SqlValue[][] | null) => void;
  setColumns: (columns: string[] | null) => void;
  setMaxSize: (size: number) => void;
  setIsDatabaseLoading: (loading: boolean) => void;
  setIsDataLoading: (loading: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setFilters: (filters: Filters) => void;
  setSorters: (sorters: Sorters) => void;
  setLimit: (limit: number) => void;
  setOffset: (offset: number | ((currentOffset: number) => number)) => void;
  setCustomQuery: (query: string) => void;
  setCustomQueryObject: (obj: CustomQueryResult | null) => void;
  setGeminiApiKey: (key: string | null) => Promise<void>;
  setIsAiLoading: (loading: boolean) => void;
  resetPagination: () => void;
  initializeApiKey: () => Promise<void>;
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
  geminiApiKey: null, // Will be initialized asynchronously
  isAiLoading: false,

  // --- Actions ---
  setTablesSchema: (schema) => set({ tablesSchema: schema }),
  setIndexesSchema: (schema) => set({ indexesSchema: schema }),
  setCurrentTable: (table) => set({ currentTable: table }),
  setData: (data) => set({ data }),
  setColumns: (columns) => set({ columns }),
  setMaxSize: (size) => set({ maxSize: size }),
  setIsDatabaseLoading: (loading) => set({ isDatabaseLoading: loading }),
  setIsDataLoading: (loading) => set({ isDataLoading: loading }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setFilters: (filters) => set({ filters }),
  setSorters: (sorters) => set({ sorters }),
  setLimit: (limit) => set({ limit }),
  setOffset: (offset) =>
    set((state) => ({
      offset: typeof offset === "function" ? offset(state.offset) : offset
    })),
  setCustomQuery: (query) => set({ customQuery: query }),
  setCustomQueryObject: (obj) => set({ customQueryObject: obj }),
  setGeminiApiKey: async (key) => {
    set({ geminiApiKey: key });
    await storeApiKey(key);
  },
  setIsAiLoading: (loading) => set({ isAiLoading: loading }),
  resetPagination: () => set({ offset: 0 }),
  initializeApiKey: async () => {
    const key = await loadApiKey();
    set({ geminiApiKey: key });
  },

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
