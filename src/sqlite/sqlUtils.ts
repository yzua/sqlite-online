import type { Database, QueryExecResult, SqlValue } from "sql.js";
import type { Filters, Sorters } from "@/types";

export function normalizeSqlStatement(sql: string) {
  return sql.replace(/COLLATE\s+unicase/gi, "COLLATE NOCASE");
}

export function isStructureChangeable(sql: string) {
  return /^\s*(CREATE|DROP|ALTER)\s/i.test(sql);
}

export function sanitizeIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

function sanitizeSortOrder(order: string): string {
  const normalizedOrder = order.toUpperCase().trim();
  return normalizedOrder === "DESC" ? "DESC" : "ASC";
}

export function buildWhereClause(filters?: Filters): {
  clause: string;
  params: string[];
} {
  if (!filters) {
    return { clause: "", params: [] };
  }

  const conditions: string[] = [];
  const params: string[] = [];

  for (const [column, value] of Object.entries(filters)) {
    conditions.push(`${sanitizeIdentifier(column)} LIKE ? ESCAPE '\\'`);
    params.push(`%${value}%`);
  }

  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "",
    params
  };
}

export function buildOrderByClause(sorters?: Sorters): string {
  if (!sorters) {
    return "";
  }

  const sortersArray = Object.entries(sorters).map(([column, order]) => {
    return `${sanitizeIdentifier(column)} ${sanitizeSortOrder(order)}`;
  });

  return sortersArray.length > 0 ? `ORDER BY ${sortersArray.join(", ")}` : "";
}

export function runPreparedQuery(
  db: Database,
  query: string,
  params: SqlValue[]
): QueryExecResult[] {
  const stmt = db.prepare(query);
  stmt.bind(params);

  const values: SqlValue[][] = [];
  while (stmt.step()) {
    values.push(stmt.get());
  }

  const results = [{ columns: stmt.getColumnNames(), values }];
  stmt.free();
  return results;
}

export function runPreparedScalar(
  db: Database,
  query: string,
  params: SqlValue[]
) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  stmt.step();
  const result = stmt.get();
  stmt.free();
  return result;
}

export function arrayToCSV(columns: string[], rows: SqlValue[][]) {
  const header = columns.map((column) => `"${column}"`).join(",");
  const csvRows = rows.map((row) =>
    columns.map((_, i) => `"${row[i] ?? ""}"`).join(",")
  );
  return [header, ...csvRows].join("\n");
}
