import type { Database, QueryExecResult, SqlJsStatic, SqlValue } from "sql.js";
import initSqlJs from "sql.js";
import { tableDataCache } from "@/lib/queryCache";
import type { Filters, IndexSchema, Sorters, TableSchema } from "@/types";
import DEMO_DB from "./demo-db";
import { readDatabaseSchema } from "./schema";
import {
  arrayToCSV,
  buildOrderByClause,
  buildWhereClause,
  isStructureChangeable,
  normalizeSqlStatement,
  runPreparedQuery,
  runPreparedScalar,
  sanitizeIdentifier
} from "./sqlUtils";

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
    sql = normalizeSqlStatement(sql);

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

  // Get the schema of the database
  // This includes tables, indexes, and foreign keys
  private getDatabaseSchema() {
    const schemaSnapshot = readDatabaseSchema((sql) => this.exec(sql));
    this.tablesSchema = schemaSnapshot.tablesSchema;
    this.indexesSchema = schemaSnapshot.indexesSchema;
    this.firstTable = schemaSnapshot.firstTable;
  }

  // Get the max size of the requested table
  // Used for pagination
  private getMaxSizeOfTable(tableName: string, filters?: Filters) {
    const { clause, params } = buildWhereClause(filters);
    const quotedTableName = sanitizeIdentifier(tableName);

    const query = `SELECT COUNT(*) FROM ${quotedTableName} ${clause}`;

    if (params.length > 0) {
      const result = runPreparedScalar(this.db, query, params);
      return Math.ceil((result as SqlValue[])[0] as number);
    } else {
      const [results] = this.exec(query);
      if (results.length === 0) return 0;
      const count = results[0]?.values[0]?.[0];
      return Math.ceil(Number(count ?? 0));
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

    let results: QueryExecResult[] = [];
    if (params.length > 0) {
      results = runPreparedQuery(this.db, query, params);
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
      const setClause = columns
        .map((column) => `${sanitizeIdentifier(column)} = ?`)
        .join(", ");

      // The WHERE clause is based on the primary key
      const query = `UPDATE ${sanitizeIdentifier(table)} SET ${setClause} WHERE ${sanitizeIdentifier(primaryKey)} = ?`;

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

      const query = `DELETE FROM ${sanitizeIdentifier(table)} WHERE ${sanitizeIdentifier(primaryKey)} = ?`;

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

      // If there are no valid columns/values, avoid executing an empty INSERT
      if (filteredEntries.length === 0) {
        throw new Error("No valid values provided for insertion.");
      }

      const filteredColumns = filteredEntries.map((entry) => entry.col);
      const filteredValues = filteredEntries.map((entry) => entry.val);

      const query = `INSERT INTO ${sanitizeIdentifier(table)} (${filteredColumns.map((column) => sanitizeIdentifier(column)).join(", ")}) VALUES (${filteredColumns.map(() => "?").join(", ")})`;

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

    if (params.length > 0) {
      return runPreparedQuery(this.db, query, params);
    } else {
      const [results] = this.exec(query);
      return results;
    }
  }
}

export { arrayToCSV };

export class CustomQueryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomQueryError";
  }
}
