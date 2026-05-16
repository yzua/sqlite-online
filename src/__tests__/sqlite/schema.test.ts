import type { QueryExecResult } from "sql.js";
import { describe, expect, it } from "vitest";
import { readDatabaseSchema } from "@/sqlite/schema";

function makeExec(
  results: QueryExecResult[]
): (sql: string) => QueryExecResult[] {
  return () => results;
}

describe("readDatabaseSchema", () => {
  it("returns empty schema for database with no tables", () => {
    const exec = makeExec([
      { columns: ["type", "name", "tbl_name"], values: [] }
    ]);
    const result = readDatabaseSchema(exec);
    expect(result.tablesSchema).toEqual({});
    expect(result.indexesSchema).toEqual([]);
    expect(result.firstTable).toBeNull();
  });

  it("reads a single table with columns", () => {
    const masterResult: QueryExecResult = {
      columns: ["type", "name", "tbl_name"],
      values: [["table", "users", "users"]]
    };
    const tableInfoResult: QueryExecResult = {
      columns: ["cid", "name", "type", "notnull", "dflt_value", "pk"],
      values: [
        [0, "id", "INTEGER", 1, null, 1],
        [1, "name", "TEXT", 0, null, 0]
      ]
    };
    const fkResult: QueryExecResult = {
      columns: [
        "id",
        "seq",
        "table",
        "from",
        "to",
        "on_update",
        "on_delete",
        "match"
      ],
      values: []
    };

    let callIndex = 0;
    const exec = () => {
      callIndex++;
      if (callIndex === 1) return [masterResult];
      if (callIndex === 2) return [tableInfoResult];
      return [fkResult];
    };

    const result = readDatabaseSchema(exec);
    expect(result.firstTable).toBe("users");
    expect(result.tablesSchema.users).toBeDefined();
    expect(result.tablesSchema.users!.type).toBe("table");
    expect(result.tablesSchema.users!.primaryKey).toBe("id");
    expect(result.tablesSchema.users!.schema).toHaveLength(2);
    expect(result.tablesSchema.users!.schema[0]).toMatchObject({
      name: "id",
      isPrimaryKey: true,
      isNullable: false
    });
    expect(result.tablesSchema.users!.schema[1]).toMatchObject({
      name: "name",
      isPrimaryKey: false,
      isNullable: true
    });
  });

  it("detects foreign keys", () => {
    const masterResult: QueryExecResult = {
      columns: ["type", "name", "tbl_name"],
      values: [["table", "orders", "orders"]]
    };
    const tableInfoResult: QueryExecResult = {
      columns: ["cid", "name", "type", "notnull", "dflt_value", "pk"],
      values: [
        [0, "id", "INTEGER", 1, null, 1],
        [1, "user_id", "INTEGER", 1, null, 0]
      ]
    };
    const fkResult: QueryExecResult = {
      columns: [
        "id",
        "seq",
        "table",
        "from",
        "to",
        "on_update",
        "on_delete",
        "match"
      ],
      values: [
        [0, 0, "users", "user_id", "id", "NO ACTION", "NO ACTION", "NONE"]
      ]
    };

    let callIndex = 0;
    const exec = () => {
      callIndex++;
      if (callIndex === 1) return [masterResult];
      if (callIndex === 2) return [tableInfoResult];
      return [fkResult];
    };

    const result = readDatabaseSchema(exec);
    expect(result.tablesSchema.orders!.schema[1]!.isForeignKey).toBe(true);
  });

  it("reads indexes", () => {
    const masterResult: QueryExecResult = {
      columns: ["type", "name", "tbl_name"],
      values: [
        ["table", "users", "users"],
        ["index", "idx_users_name", "users"]
      ]
    };
    const tableInfoResult: QueryExecResult = {
      columns: ["cid", "name", "type", "notnull", "dflt_value", "pk"],
      values: [[0, "id", "INTEGER", 1, null, 1]]
    };
    const fkResult: QueryExecResult = {
      columns: [
        "id",
        "seq",
        "table",
        "from",
        "to",
        "on_update",
        "on_delete",
        "match"
      ],
      values: []
    };

    let callIndex = 0;
    const exec = () => {
      callIndex++;
      if (callIndex === 1) return [masterResult];
      if (callIndex === 2) return [tableInfoResult];
      return [fkResult];
    };

    const result = readDatabaseSchema(exec);
    expect(result.indexesSchema).toEqual([
      { name: "idx_users_name", tableName: "users" }
    ]);
  });

  it("reads views with null primary key", () => {
    const masterResult: QueryExecResult = {
      columns: ["type", "name", "tbl_name"],
      values: [["view", "v_users", "v_users"]]
    };
    const tableInfoResult: QueryExecResult = {
      columns: ["cid", "name", "type", "notnull", "dflt_value", "pk"],
      values: [[0, "name", "TEXT", 0, null, 0]]
    };

    let callIndex = 0;
    const exec = () => {
      callIndex++;
      if (callIndex === 1) return [masterResult];
      return [tableInfoResult];
    };

    const result = readDatabaseSchema(exec);
    expect(result.tablesSchema["v_users"]!.type).toBe("view");
    expect(result.tablesSchema["v_users"]!.primaryKey).toBeNull();
  });
});
