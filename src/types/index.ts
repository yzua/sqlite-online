import type { SqlValue } from "sql.js";

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
