import type { QueryExecResult, SqlValue } from "sql.js";

export type TableSchema = {
  [tableName: string]: {
    primaryKey: "_rowid_" | string | null;
    schema: TableSchemaRow[];
    type: "table" | "view";
  };
};

export type TableSchemaRow = {
  name: string; // Column name
  cid: number;
  type: string | null;
  dflt_value: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
};

export type IndexSchema = {
  name: string;
  tableName: string;
};

export type Sorters = Record<string, "asc" | "desc"> | null;
export type Filters = Record<string, string> | null;
export type EditResultType = "updated" | "deleted";

export interface CustomQueryResult {
  data: SqlValue[][];
  columns: string[];
}

export interface TableQueryPayload {
  currentTable: string;
  limit: number;
  offset: number;
  filters: Filters;
  sorters: Sorters;
}

export type EditTypes = "insert" | "update" | "delete";
export type ExportTypes = "table" | "current" | "custom";

// --- WORKER MESSAGES --- //
interface InitEvent {
  action: "init";
  payload?: undefined;
}

interface OpenFileEvent {
  action: "openFile";
  payload: {
    file: ArrayBuffer;
  };
}

interface RefreshEvent {
  action: "refresh";
  payload: TableQueryPayload;
}

interface ExecEvent {
  action: "exec";
  payload: TableQueryPayload & {
    query: string;
  };
}

interface ExecBatchEvent {
  action: "execBatch";
  payload: TableQueryPayload & {
    queries: string[];
  };
}

interface GetTableDataEvent {
  action: "getTableData";
  payload: TableQueryPayload;
}

interface DownloadEvent {
  action: "download";
  payload?: undefined;
}

interface UpdateEvent {
  action: "update";
  payload: {
    table: string;
    columns: string[];
    values: SqlValue[];
    primaryValue: SqlValue;
  } & TableQueryPayload;
}

interface DeleteEvent {
  action: "delete";
  payload: {
    table: string;
    primaryValue: SqlValue;
  } & TableQueryPayload;
}

interface InsertEvent {
  action: "insert";
  payload: {
    table: string;
    columns: string[];
    values: SqlValue[];
  } & TableQueryPayload;
}

interface ExportEvent {
  action: "export";
  payload: {
    table: string;
    filters: Filters;
    sorters: Sorters;
    limit: number;
    offset: number;
    customQuery: string;
    exportType: ExportTypes;
  };
}

export type WorkerEvent =
  | InitEvent
  | OpenFileEvent
  | RefreshEvent
  | ExecEvent
  | ExecBatchEvent
  | GetTableDataEvent
  | DownloadEvent
  | UpdateEvent
  | DeleteEvent
  | InsertEvent
  | ExportEvent;

// --- WORKER RESPONSE --- //
interface InitCompleteResponse {
  action: "initComplete";
  payload: {
    tableSchema: TableSchema;
    indexSchema: IndexSchema[];
    currentTable: string;
  };
}

interface QueryCompleteResponse {
  action: "queryComplete";
  payload: {
    results?: QueryExecResult[];
    maxSize: number;
  };
}

interface CustomQueryCompleteResponse {
  action: "customQueryComplete";
  payload: {
    results: QueryExecResult[];
  };
}

interface UpdateInstanceResponse {
  action: "updateInstance";
  payload: {
    tableSchema: TableSchema;
    indexSchema: IndexSchema[];
  };
}

interface UpdateCompleteResponse {
  action: "updateComplete";
  payload: {
    type: EditResultType;
  };
}

interface InsertCompleteResponse {
  action: "insertComplete";
}

interface DownloadCompleteResponse {
  action: "downloadComplete";
  payload: {
    bytes: ArrayBuffer;
  };
}

interface ExportCompleteResponse {
  action: "exportComplete";
  payload: {
    results: string;
  };
}

interface QueryErrorResponse {
  action: "queryError";
  payload: {
    error: {
      message: string;
      isCustomQueryError: boolean;
    };
  };
}

// Union type for all possible worker responses
export type WorkerResponseEvent =
  | InitCompleteResponse
  | QueryCompleteResponse
  | CustomQueryCompleteResponse
  | UpdateInstanceResponse
  | UpdateCompleteResponse
  | InsertCompleteResponse
  | DownloadCompleteResponse
  | ExportCompleteResponse
  | QueryErrorResponse;
