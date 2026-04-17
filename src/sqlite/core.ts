import type { Database, QueryExecResult, SqlJsStatic, SqlValue } from "sql.js";
import initSqlJs from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { tableDataCache } from "@/lib/queryCache";
import type { Filters, IndexSchema, Sorters, TableSchema } from "@/types";
import DEMO_DB from "./demo-db";
import { readDatabaseSchema } from "./schema";
import {
  buildOrderByClause,
  buildWhereClause,
  isStructureChangeable,
  normalizeSqlStatement,
  runPreparedQuery,
  runPreparedScalar,
  sanitizeIdentifier
} from "./sqlUtils";

export default class Sqlite {
  // Static SQL.js instance — cached after first initialization
  static sqlJsStatic?: SqlJsStatic;
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
        locateFile: () => sqlWasmUrl
      });
      Sqlite.sqlJsStatic = SQL;
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
  public exec(sql: string, options?: { skipSchemaUpdate?: boolean }) {
    sql = normalizeSqlStatement(sql);

    const results = this.db.exec(sql);
    const upperSql = sql.toUpperCase();
    // If the statement requires schema updates
    let doTablesChanged = false;

    // Update tables if the SQL statement is a CREATE TABLE statement.
    if (isStructureChangeable(upperSql)) {
      if (!options?.skipSchemaUpdate) {
        this.getDatabaseSchema();
      }
      doTablesChanged = true;
    }

    return [results, doTablesChanged] as const;
  }

  // Refresh the cached schema — call after batch DDL to avoid N re-reads
  public refreshSchema() {
    this.getDatabaseSchema();
  }

  // Return the database as bytes
  // Used for downloading the database
  public download() {
    return this.db.export();
  }

  // Get the schema of the database
  // This includes tables, indexes, and foreign keys
  private getDatabaseSchema() {
    const schemaSnapshot = readDatabaseSchema((sql) => this.db.exec(sql));
    this.tablesSchema = schemaSnapshot.tablesSchema;
    this.indexesSchema = schemaSnapshot.indexesSchema;
    this.firstTable = schemaSnapshot.firstTable;
  }

  // Run a query, using prepared statement when params are provided
  private runQuery(query: string, params: string[] = []) {
    if (params.length > 0) {
      return runPreparedQuery(this.db, query, params);
    }
    const [results] = this.exec(query);
    return results;
  }

  // Get the max size of the requested table
  // Used for pagination
  private getMaxSizeOfTable(tableName: string, filters?: Filters) {
    const { clause, params } = buildWhereClause(filters);
    const quotedTableName = sanitizeIdentifier(tableName);

    const query = `SELECT COUNT(*) FROM ${quotedTableName} ${clause}`;

    if (params.length > 0) {
      const result = runPreparedScalar(this.db, query, params);
      return (result as SqlValue[])[0] as number;
    }

    const results = this.runQuery(query);
    if (results.length === 0) return 0;
    const count = results[0]?.values[0]?.[0];
    return Number(count ?? 0);
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
    if (cachedResult) {
      return cachedResult as readonly [QueryExecResult[], number];
    }

    const primaryKey = this.getPrimaryKey(table);
    const quotedTable = sanitizeIdentifier(table);
    const selectClause = primaryKey
      ? `${sanitizeIdentifier(primaryKey)}, *`
      : "*";

    const { clause: whereClause, params } = buildWhereClause(filters);
    const orderByClause = buildOrderByClause(sorters);

    const query = `
      SELECT ${selectClause} FROM ${quotedTable}
      ${whereClause}
      ${orderByClause}
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const results = this.runQuery(query, params);

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

  // Execute a mutation (insert/update/delete) with cache invalidation
  private withCacheInvalidation(
    table: string,
    operation: string,
    fn: () => void
  ) {
    try {
      fn();
      tableDataCache.invalidateTable(table);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Error while ${operation} table ${table}: ${message}`);
    }
  }

  // Update a row in a table
  public update(
    table: string,
    columns: string[],
    values: SqlValue[],
    id: SqlValue
  ) {
    this.withCacheInvalidation(table, "updating", () => {
      const primaryKey = this.getPrimaryKey(table);
      if (!primaryKey) {
        throw new Error(
          `Table or view "${table}" does not have a primary key and cannot be updated.`
        );
      }

      const setClause = columns
        .map((column) => `${sanitizeIdentifier(column)} = ?`)
        .join(", ");

      const query = `UPDATE ${sanitizeIdentifier(table)} SET ${setClause} WHERE ${sanitizeIdentifier(primaryKey)} = ?`;

      const normalizedValues = values.map((value) =>
        value === "" ? null : value
      );

      const stmt = this.db.prepare(query);
      stmt.run([...normalizedValues, id]);
      stmt.free();
    });
  }

  // Delete a row from a table
  public delete(table: string, id: SqlValue) {
    this.withCacheInvalidation(table, "deleting from", () => {
      const primaryKey = this.getPrimaryKey(table);
      if (!primaryKey) {
        throw new Error(
          `Table or view "${table}" does not have a primary key and cannot be deleted from.`
        );
      }

      const query = `DELETE FROM ${sanitizeIdentifier(table)} WHERE ${sanitizeIdentifier(primaryKey)} = ?`;

      const stmt = this.db.prepare(query);
      stmt.run([id]);
      stmt.free();
    });
  }

  // Insert a row into a table
  public insert(table: string, columns: string[], values: SqlValue[]) {
    this.withCacheInvalidation(table, "inserting into", () => {
      const filteredEntries = columns
        .map((col, index) => {
          const value = values[index];
          if (value === undefined || value === "") {
            return null;
          }

          return { col, val: value };
        })
        .filter(
          (entry): entry is { col: string; val: SqlValue } => entry !== null
        );

      if (filteredEntries.length === 0) {
        throw new Error("No valid values provided for insertion.");
      }

      const filteredColumns = filteredEntries.map((entry) => entry.col);
      const filteredValues = filteredEntries.map((entry) => entry.val);

      const query = `INSERT INTO ${sanitizeIdentifier(table)} (${filteredColumns.map((column) => sanitizeIdentifier(column)).join(", ")}) VALUES (${filteredColumns.map(() => "?").join(", ")})`;

      const stmt = this.db.prepare(query);
      stmt.run([...filteredValues]);
      stmt.free();
    });
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

    const quotedTable = sanitizeIdentifier(table);
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

    return this.runQuery(query, params);
  }
}

export class CustomQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomQueryError";
  }
}
