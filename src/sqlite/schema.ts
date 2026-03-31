import type { QueryExecResult } from "sql.js";
import type { IndexSchema, TableSchema, TableSchemaRow } from "@/types";

interface SchemaSnapshot {
  tablesSchema: TableSchema;
  indexesSchema: IndexSchema[];
  firstTable: string | null;
}

type ExecSql = (sql: string) => readonly [QueryExecResult[], boolean];

export function readTableInfo(exec: ExecSql, tableName: string) {
  const [pragmaTableInfoResults] = exec(`PRAGMA table_info("${tableName}")`);
  const [pragmaForeignKeysResults] = exec(
    `PRAGMA foreign_key_list("${tableName}")`
  );

  const foreignKeys: Record<string, boolean> = {};
  const foreignKeyRows = pragmaForeignKeysResults[0]?.values ?? [];
  for (const row of foreignKeyRows) {
    foreignKeys[row[3] as string] = true;
  }

  let primaryKey = "_rowid_";
  const tableSchema: TableSchemaRow[] = [];
  const tableInfoRows = pragmaTableInfoResults[0]?.values ?? [];

  if (tableInfoRows.length === 0) {
    console.error("No table info found");
    return [tableSchema, primaryKey] as const;
  }

  for (const row of tableInfoRows) {
    const [cid, name, type, notnull, dflt_value, pk] = row;
    if (pk === 1) {
      primaryKey = name as string;
    }

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

  return [tableSchema, primaryKey] as const;
}

export function readDatabaseSchema(exec: ExecSql): SchemaSnapshot {
  const tablesSchema: TableSchema = {};
  const indexesSchema: IndexSchema[] = [];

  const [results] = exec(
    "SELECT type, name, tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'"
  );

  const schemaRows = results[0]?.values ?? [];
  for (const row of schemaRows) {
    const [type, name, tableName] = row;
    if (type === "table" || type === "view") {
      const [tableSchema, primaryKey] = readTableInfo(
        exec,
        tableName as string
      );
      tablesSchema[tableName as string] = {
        schema: tableSchema,
        primaryKey: type === "view" ? null : primaryKey,
        type: type as "table" | "view"
      };
      continue;
    }

    if (type === "index") {
      indexesSchema.push({
        name: name as string,
        tableName: tableName as string
      });
    }
  }

  return {
    tablesSchema,
    indexesSchema,
    firstTable: Object.keys(tablesSchema)[0] ?? null
  };
}
