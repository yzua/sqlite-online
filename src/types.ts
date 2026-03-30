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
  IsNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
};

export type IndexSchema = {
  name: string;
  tableName: string;
};

export type Sorters = Record<string, "asc" | "desc"> | null;
export type Filters = Record<string, string> | null;

export type EditTypes = "insert" | "update" | "delete";
export type exportTypes = "table" | "current" | "custom";

// --- WORKER MESSAGES --- //
interface InitEvent {
  action: "init";
  payload: undefined;
}

interface OpenFileEvent {
  action: "openFile";
  payload: {
    file: ArrayBuffer;
  };
}

interface RefreshEvent {
  action: "refresh";
  payload: {
    currentTable: string;
    limit: number;
    offset: number;
    filters: Filters;
    sorters: Sorters;
  };
}

interface ExecEvent {
  action: "exec";
  payload: {
    query: string;
    currentTable: string;
    limit: number;
    offset: number;
    filters: Filters;
    sorters: Sorters;
  };
}

interface ExecBatchEvent {
  action: "execBatch";
  payload: {
    queries: string[];
    currentTable: string;
    limit: number;
    offset: number;
    filters: Filters;
    sorters: Sorters;
  };
}

interface GetTableDataEvent {
  action: "getTableData";
  payload: {
    currentTable: string;
    limit: number;
    offset: number;
    filters: Filters;
    sorters: Sorters;
  };
}

interface DownloadEvent {
  action: "download";
  payload: undefined;
}

interface UpdateEvent {
  action: "update";
  payload: {
    table: string;
    columns: string[];
    values: SqlValue[];
    primaryValue: SqlValue;
  };
}

interface DeleteEvent {
  action: "delete";
  payload: {
    table: string;
    primaryValue: SqlValue;
  };
}

interface InsertEvent {
  action: "insert";
  payload: {
    table: string;
    columns: string[];
    values: SqlValue[];
  };
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
    exportType: exportTypes;
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
    type: EditTypes;
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
