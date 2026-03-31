export function parseSqlStatements(query: string) {
  return query
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement !== "");
}
