import type { QueryExecResult } from "sql.js";
import type { IndexSchema, TableSchema, TableSchemaRow } from "@/types";

interface SchemaSnapshot {
  tablesSchema: TableSchema;
  indexesSchema: IndexSchema[];
  firstTable: string | null;
}

type ExecSql = (sql: string) => QueryExecResult[];

export function readDatabaseSchema(exec: ExecSql): SchemaSnapshot {
  const tablesSchema: TableSchema = {};
  const indexesSchema: IndexSchema[] = [];

  const results = exec(
    "SELECT type, name, tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'"
  );

  const schemaRows = results[0]?.values ?? [];
  const tableViewNames: string[] = [];
  const tableViewTypes = new Map<string, "table" | "view">();
  const tableOnlyNames: string[] = [];

  for (const row of schemaRows) {
    const [type, name, tableName] = row;
    if (type === "table" || type === "view") {
      const tblName = tableName as string;
      tableViewNames.push(tblName);
      tableViewTypes.set(tblName, type as "table" | "view");
      if (type === "table") {
        tableOnlyNames.push(tblName);
      }
      continue;
    }

    if (type === "index") {
      indexesSchema.push({
        name: name as string,
        tableName: tableName as string
      });
    }
  }

  if (tableViewNames.length === 0) {
    return { tablesSchema, indexesSchema, firstTable: null };
  }

  // Batch all PRAGMA table_info calls into one exec() instead of N.
  const tableInfoResults = exec(
    tableViewNames.map((name) => `PRAGMA table_info("${name}")`).join("; ")
  );

  // Batch PRAGMA foreign_key_list for tables only (views have none).
  const fkMap = new Map<string, Record<string, boolean>>();
  if (tableOnlyNames.length > 0) {
    const fkResults = exec(
      tableOnlyNames
        .map((name) => `PRAGMA foreign_key_list("${name}")`)
        .join("; ")
    );

    for (const [i, tableName] of tableOnlyNames.entries()) {
      const foreignKeys: Record<string, boolean> = {};
      for (const row of fkResults[i]?.values ?? []) {
        foreignKeys[row[3] as string] = true;
      }
      fkMap.set(tableName, foreignKeys);
    }
  }

  for (const [i, tblName] of tableViewNames.entries()) {
    const type = tableViewTypes.get(tblName) as "table" | "view";
    const tableInfoRows = tableInfoResults[i]?.values ?? [];

    if (tableInfoRows.length === 0) {
      console.error("No table info found for", tblName);
      tablesSchema[tblName] = {
        schema: [],
        primaryKey: type === "view" ? null : "_rowid_",
        type
      };
      continue;
    }

    const foreignKeys = type === "table" ? (fkMap.get(tblName) ?? {}) : {};
    let primaryKey = "_rowid_";
    const tableSchema: TableSchemaRow[] = [];

    for (const row of tableInfoRows) {
      const [cid, name, colType, notnull, dflt_value, pk] = row;
      if (pk === 1) {
        primaryKey = name as string;
      }

      tableSchema.push({
        name: (name as string) || "Unknown",
        cid: cid as number,
        type: (colType as string) || "Unknown",
        dflt_value: dflt_value as string,
        isNullable: (notnull as number) === 0 && pk === 0,
        isPrimaryKey: (pk as number) === 1,
        isForeignKey: foreignKeys[name as string] ?? false
      });
    }

    tablesSchema[tblName] = {
      schema: tableSchema,
      primaryKey: type === "view" ? null : primaryKey,
      type
    };
  }

  return {
    tablesSchema,
    indexesSchema,
    firstTable: tableViewNames[0] ?? null
  };
}
