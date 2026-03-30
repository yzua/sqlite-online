import initSqlJs from "sql.js";

import DEMO_DB from "./demo-db";
import { tableDataCache } from "@/lib/queryCache";

import type { Database, SqlJsStatic, SqlValue, QueryExecResult } from "sql.js";
import type {
  Filters,
  IndexSchema,
  Sorters,
  TableSchema,
  TableSchemaRow
} from "@/types";

export default class Sqlite {
  // Static SQL.js instance
  static readonly sqlJsStatic?: SqlJsStatic;
  // Database instance
  public readonly db: Database;

  public firstTable: string | null = null;
  public tablesSchema: TableSchema = {};
  public indexesSchema: IndexSchema[] = [];

  private constructor(db: Database, isFile = false) {
    this.db = db;
    // Check if user is opening a file or creating a new database.
    if (!isFile) {
      // The demo database
      this.db.exec(DEMO_DB);
    }
    this.getDatabaseSchema();
  }

  // Initialize SQL.js

  private static async initSQLjs(): Promise<SqlJsStatic> {
    if (Sqlite.sqlJsStatic) return Sqlite.sqlJsStatic;
    try {
      const SQL = await initSqlJs({
        locateFile: (file) => `${import.meta.env.BASE_URL}wasm/${file}`
      });
      return SQL;
    } catch (error) {
      console.error("Core: Failed to initialize SQL.js:", error);
      throw new Error(
        `Failed to initialize SQL.js: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Initialize a new database
  public static async create(): Promise<Sqlite> {
    const SQL = await Sqlite.initSQLjs();
    const db = new SQL.Database();
    return new Sqlite(db, false);
  }

  // Initialize a new database from a file
  public static async open(file: Uint8Array): Promise<Sqlite> {
    const SQL = await Sqlite.initSQLjs();
    const db = new SQL.Database(file);
    return new Sqlite(db, true);
  }

  // Execute a SQL statement
  public exec(sql: string) {
    sql = sql.replace(/COLLATE\s+unicase/gi, "COLLATE NOCASE");

    const results = this.db.exec(sql);
    const upperSql = sql.toUpperCase();
    // If the statement requires schema updates
    let doTablesChanged = false;

    // Update tables if the SQL statement is a CREATE TABLE statement.
    if (isStructureChangeable(upperSql)) {
      this.getDatabaseSchema(); // Update schema after creating a new table.
      doTablesChanged = true;
    }

    return [results, doTablesChanged] as const;
  }

  // Return the database as bytes
  // Used for downloading the database
  public download() {
    return this.db.export();
  }

  // Get the information of a table
  // This includes the columns, primary key, default values, ...
  private getTableInfo(tableName: string) {
    const [pragmaTableInfoResults] = this.exec(
      `PRAGMA table_info("${tableName}")`
    );
    const [pragmaForeignKeysResults] = this.exec(
      `PRAGMA foreign_key_list("${tableName}")`
    );

    const foreignKeys: Record<string, boolean> = {};
    if (pragmaForeignKeysResults.length > 0) {
      for (const row of pragmaForeignKeysResults[0].values) {
        foreignKeys[row[3] as string] = true; // Get the 'from'
      }
    }

    let primaryKey = "_rowid_";
    const tableSchema: TableSchemaRow[] = [];
    if (pragmaTableInfoResults.length > 0) {
      for (const row of pragmaTableInfoResults[0].values) {
        const [cid, name, type, notnull, dflt_value, pk] = row;
        if (pk === 1) primaryKey = name as string;
        tableSchema.push({
          name: (name as string) || "Unknown",
          cid: cid as number,
          type: (type as string) || "Unknown",
          dflt_value: dflt_value as string,
          IsNullable: (notnull as number) === 0 && pk === 0,
          isPrimaryKey: (pk as number) === 1,
          isForeignKey: foreignKeys[name as string] ?? false
        });
      }
    } else {
      console.error("No table info found");
    }

    return [tableSchema, primaryKey] as const;
  }

  // Get the schema of the database
  // This includes tables, indexes, and foreign keys
  private getDatabaseSchema() {
    // Reset the schema
    this.tablesSchema = {};
    this.indexesSchema = [];
    this.firstTable = null;

    const [results] = this.exec(
      "SELECT type, name, tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'"
    );

    if (results.length === 0) return;

    for (const row of results[0].values) {
      const [type, name, tableName] = row;
      if (type === "table" || type === "view") {
        const [tableSchema, primaryKey] = this.getTableInfo(
          tableName as string
        );
        this.tablesSchema[tableName as string] = {
          schema: tableSchema,
          primaryKey: type === "view" ? null : primaryKey,
          type: type as "table" | "view"
        };
      } else if (type === "index") {
        this.indexesSchema.push({
          name: name as string,
          tableName: tableName as string
        });
      }
    }

    this.firstTable = Object.keys(this.tablesSchema)[0];
  }

  // Get the max size of the requested table
  // Used for pagination
  private getMaxSizeOfTable(tableName: string, filters?: Filters) {
    const { clause, params } = buildWhereClause(filters);
    const quotedTableName = sanitizeColumnName(tableName);

    const query = `SELECT COUNT(*) FROM ${quotedTableName} ${clause}`;

    if (params.length > 0) {
      const stmt = this.db.prepare(query);
      stmt.bind(params);
      stmt.step();
      const result = stmt.get();
      stmt.free();
      return Math.ceil((result as SqlValue[])[0] as number);
    } else {
      const [results] = this.exec(query);
      if (results.length === 0) return 0;
      return Math.ceil(results[0].values[0][0] as number);
    }
  }

  // Get the data for the requested table
  // Applies filters and sorters to the data
  public getTableData(
    table: string,
    limit: number,
    offset: number,
    filters?: Filters,
    sorters?: Sorters
  ) {
    // Validate limit and offset to prevent injection
    const safeLimit = Math.max(1, Math.min(10000, Math.floor(Number(limit))));
    const safeOffset = Math.max(0, Math.floor(Number(offset)));

    // Check cache first
    const cachedResult = tableDataCache.get(
      table,
      safeLimit,
      safeOffset,
      filters,
      sorters
    );
    if (
      cachedResult &&
      Array.isArray(cachedResult) &&
      cachedResult.length === 2
    ) {
      return cachedResult as unknown as readonly [QueryExecResult[], number];
    }

    const primaryKey = this.getPrimaryKey(table);
    const quotedTable = sanitizeColumnName(table);
    const selectClause = primaryKey
      ? `${sanitizeColumnName(primaryKey)}, *`
      : "*";

    const { clause: whereClause, params } = buildWhereClause(filters);
    const orderByClause = buildOrderByClause(sorters);

    const query = `
      SELECT ${selectClause} FROM ${quotedTable}
      ${whereClause}
      ${orderByClause}
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    let results;
    if (params.length > 0) {
      const stmt = this.db.prepare(query);
      stmt.bind(params);
      const values: SqlValue[][] = [];
      while (stmt.step()) {
        values.push(stmt.get());
      }
      results = [{ columns: stmt.getColumnNames(), values }];
      stmt.free();
    } else {
      [results] = this.exec(query);
    }

    // If the table is empty return empty results with zero count
    if (results.length === 0) return [[], 0] as const;

    const maxSize = this.getMaxSizeOfTable(table, filters);
    const result = [results, maxSize] as const;

    // Cache the result
    tableDataCache.set(table, safeLimit, safeOffset, result, filters, sorters);

    return result;
  }

  // Get the primary key of a table
  private getPrimaryKey(table: string): string | null {
    const tableSchema = this.tablesSchema[table];
    if (!tableSchema) {
      throw new Error(`Table "${table}" not found.`);
    }

    return tableSchema.primaryKey;
  }

  // Update a row in a table
  public update(
    table: string,
    columns: string[],
    values: SqlValue[],
    id: SqlValue
  ) {
    try {
      const primaryKey = this.getPrimaryKey(table);
      if (!primaryKey) {
        throw new Error(
          `Table or view "${table}" does not have a primary key and cannot be updated.`
        );
      }

      // Construct the SET clause
      const setClause = columns.map((column) => `"${column}" = ?`).join(", ");

      // The WHERE clause is based on the primary key
      const query = `UPDATE "${table}" SET ${setClause} WHERE "${primaryKey}" = ?`;

      // Update values make '' -> NULL
      values = values.map((value) => (value === "" ? null : value));

      // Prepare and execute the query
      const stmt = this.db.prepare(query);
      stmt.run([...values, id]); // Primary key is the last parameter
      stmt.free();

      // Invalidate cache for this table
      tableDataCache.invalidateTable(table);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Error while updating table ${table}: ${error.message}`
        );
      } else {
        throw new Error(`Error while updating table ${table}: ${error}`);
      }
    }
  }

  // Delete a row from a table
  public delete(table: string, id: SqlValue) {
    try {
      const primaryKey = this.getPrimaryKey(table);
      if (!primaryKey) {
        throw new Error(
          `Table or view "${table}" does not have a primary key and cannot be deleted from.`
        );
      }

      const query = `DELETE FROM "${table}" WHERE "${primaryKey}" = ?`;

      const stmt = this.db.prepare(query);
      stmt.run([id]);
      stmt.free();

      // Invalidate cache for this table
      tableDataCache.invalidateTable(table);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Error while deleting from table ${table}: ${error.message}`
        );
      } else {
        throw new Error(`Error while deleting from table ${table}: ${error}`);
      }
    }
  }

  // Insert a row into a table
  public insert(table: string, columns: string[], values: SqlValue[]) {
    try {
      // Filter out empty values and their corresponding columns
      const filteredEntries = columns
        .map((col, index) => ({ col, val: values[index] }))
        .filter((entry) => entry.val !== "");

      // If there are no valid columns/values, avoid executing an empty INSERT
      if (filteredEntries.length === 0) {
        throw new Error("No valid values provided for insertion.");
      }

      const filteredColumns = filteredEntries.map((entry) => entry.col);
      const filteredValues = filteredEntries.map((entry) => entry.val);

      const query = `INSERT INTO "${table}" (${filteredColumns.join(", ")}) VALUES (${filteredColumns.map(() => "?").join(", ")})`;

      const stmt = this.db.prepare(query);
      stmt.run([...filteredValues]);
      stmt.free();

      // Invalidate cache for this table
      tableDataCache.invalidateTable(table);
    } catch (error) {
      throw new Error(`Error while inserting into table ${table}: ${error}`);
    }
  }

  // Used for exporting data as CSV
  public export({
    table,
    offset,
    limit,
    filters,
    sorters,
    customQuery
  }: {
    table?: string;
    offset?: number;
    limit?: number;
    filters?: Filters;
    sorters?: Sorters;
    customQuery?: string;
  }) {
    if (customQuery) {
      const [results] = this.exec(customQuery);
      return results;
    }

    if (!table) {
      throw new Error("Table name is required when not using custom query");
    }

    const quotedTable = sanitizeColumnName(table);
    const { clause: whereClause, params } = buildWhereClause(filters);
    const orderByClause = buildOrderByClause(sorters);

    let query = `SELECT * FROM ${quotedTable} ${whereClause} ${orderByClause}`;

    if (offset && limit) {
      const safeLimit = Math.max(
        1,
        Math.min(100000, Math.floor(Number(limit)))
      );
      const safeOffset = Math.max(0, Math.floor(Number(offset)));
      query += ` LIMIT ${safeLimit} OFFSET ${safeOffset}`;
    }

    if (params.length > 0) {
      const stmt = this.db.prepare(query);
      stmt.bind(params);
      const values: SqlValue[][] = [];
      while (stmt.step()) {
        values.push(stmt.get());
      }
      const results = [{ columns: stmt.getColumnNames(), values }];
      stmt.free();
      return results;
    } else {
      const [results] = this.exec(query);
      return results;
    }
  }
}

// Check if the SQL statement is a structure changeable statement
function isStructureChangeable(sql: string) {
  const match = RegExp(/^\s*(CREATE|DROP|ALTER)\s/i).exec(sql);
  return match !== null;
}

// Simple column name quoting for SQL
function sanitizeColumnName(columnName: string): string {
  return `"${columnName.replace(/"/g, '""')}"`;
}

// Simple sort order normalization
function sanitizeSortOrder(order: string): string {
  const normalizedOrder = order.toUpperCase().trim();
  return normalizedOrder === "DESC" ? "DESC" : "ASC";
}

// Build the WHERE clause for a SQL statement with parameterized queries
function buildWhereClause(filters?: Filters): {
  clause: string;
  params: string[];
} {
  if (!filters) return { clause: "", params: [] };

  const conditions: string[] = [];
  const params: string[] = [];

  Object.entries(filters).forEach(([column, value]) => {
    const quotedColumn = sanitizeColumnName(column);
    conditions.push(`${quotedColumn} LIKE ? ESCAPE '\\'`);
    params.push(`%${value}%`);
  });

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params
  };
}

// Build the ORDER BY clause for a SQL statement
function buildOrderByClause(sorters?: Sorters): string {
  if (!sorters) return "";

  const sortersArray = Object.entries(sorters).map(([column, order]) => {
    const quotedColumn = sanitizeColumnName(column);
    const normalizedOrder = sanitizeSortOrder(order);
    return `${quotedColumn} ${normalizedOrder}`;
  });

  return sortersArray.length > 0 ? `ORDER BY ${sortersArray.join(", ")}` : "";
}

// Convert an array of objects to a CSV string
export function arrayToCSV(columns: string[], rows: SqlValue[][]) {
  const header = columns.map((col) => `"${col}"`).join(",");
  const csvRows = rows.map((row) =>
    columns.map((col) => `"${row[columns.indexOf(col)]}"`).join(",")
  );
  return [header, ...csvRows].join("\n");
}

export class CustomQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomQueryError";
  }
}
