import { useCallback, useMemo } from "react";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import useTheme from "@/hooks/useTheme";

import CodeMirror from "@uiw/react-codemirror";
import { darcula } from "@uiw/codemirror-theme-darcula";
import { sql, SQLite } from "@codemirror/lang-sql";
import {
  autocompletion,
  type CompletionContext
} from "@codemirror/autocomplete";

// SQLlite Keywords used for autocompletion
const SQLITE_KEYWORDS = [
  "ABORT",
  "ACTION",
  "ADD",
  "AFTER",
  "ALL",
  "ALTER",
  "ANALYZE",
  "AND",
  "AS",
  "ASC",
  "ATTACH",
  "AUTOINCREMENT",
  "BEFORE",
  "BEGIN",
  "BETWEEN",
  "BY",
  "CASCADE",
  "CASE",
  "CAST",
  "CHECK",
  "COLLATE",
  "COLUMN",
  "COMMIT",
  "CONFLICT",
  "CONSTRAINT",
  "CREATE",
  "CROSS",
  "CURRENT_DATE",
  "CURRENT_TIME",
  "CURRENT_TIMESTAMP",
  "DATABASE",
  "DEFAULT",
  "DEFERRABLE",
  "DEFERRED",
  "DELETE",
  "DESC",
  "DETACH",
  "DISTINCT",
  "DROP",
  "EACH",
  "ELSE",
  "END",
  "ESCAPE",
  "EXCEPT",
  "EXCLUSIVE",
  "EXISTS",
  "EXPLAIN",
  "FAIL",
  "FOR",
  "FOREIGN",
  "FROM",
  "FULL",
  "GLOB",
  "GROUP",
  "HAVING",
  "IF",
  "IGNORE",
  "IMMEDIATE",
  "IN",
  "INDEX",
  "INDEXED",
  "INITIALLY",
  "INNER",
  "INSERT",
  "INSTEAD",
  "INTERSECT",
  "INTO",
  "IS",
  "ISNULL",
  "JOIN",
  "KEY",
  "LEFT",
  "LIKE",
  "LIMIT",
  "MATCH",
  "NATURAL",
  "NO",
  "NOT",
  "NOTNULL",
  "NULL",
  "OF",
  "OFFSET",
  "ON",
  "OR",
  "ORDER",
  "OUTER",
  "PLAN",
  "PRAGMA",
  "PRIMARY",
  "QUERY",
  "RAISE",
  "RECURSIVE",
  "REFERENCES",
  "REGEXP",
  "REINDEX",
  "RELEASE",
  "RENAME",
  "REPLACE",
  "RESTRICT",
  "RIGHT",
  "ROLLBACK",
  "ROW",
  "SAVEPOINT",
  "SELECT",
  "SET",
  "TABLE",
  "TEMP",
  "TEMPORARY",
  "THEN",
  "TO",
  "TRANSACTION",
  "TRIGGER",
  "UNION",
  "UNIQUE",
  "UPDATE",
  "USING",
  "VACUUM",
  "VALUES",
  "VIEW",
  "VIRTUAL",
  "WHEN",
  "WHERE",
  "WITH",
  "WITHOUT"
];

// SQLite functions used for autocompletion
const BUILT_IN_FUNCTIONS = [
  "ABS",
  "ACOS",
  "ASIN",
  "ATAN",
  "CEIL",
  "COS",
  "EXP",
  "FLOOR",
  "HEX",
  "LENGTH",
  "LOG",
  "LOWER",
  "LTRIM",
  "OCT",
  "PI",
  "POW",
  "ROUND",
  "SIGN",
  "SIN",
  "SQRT",
  "TAN",
  "TRIM",
  "UPPER"
];

function CustomSQLTextarea() {
  const { theme } = useTheme();
  const customQuery = useDatabaseStore((state) => state.customQuery);
  const setCustomQuery = useDatabaseStore((state) => state.setCustomQuery);
  const tablesSchema = useDatabaseStore((state) => state.tablesSchema);

  const { tableNames, columnNames } = useMemo(() => {
    const tableNames = Object.keys(tablesSchema);
    const columnNames = tableNames.flatMap((table) =>
      tablesSchema[table].schema.map((col) => col.name)
    );
    return { tableNames, columnNames };
  }, [tablesSchema]);

  const completionOptions = useMemo(() => {
    return [
      ...SQLITE_KEYWORDS.map((keyword) => ({
        label: keyword,
        type: "keyword"
      })),
      ...BUILT_IN_FUNCTIONS.map((fn) => ({
        label: fn,
        type: "function"
      })),
      ...tableNames.map((table) => ({
        label: table,
        type: "table"
      })),
      ...columnNames.map((column) => ({
        label: column,
        type: "column"
      }))
    ];
  }, [tableNames, columnNames]);

  const myCompletions = useCallback(
    (context: CompletionContext) => {
      const word = context.matchBefore(/\w*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;
      return {
        from: word.from,
        to: word.to,
        options: completionOptions
      };
    },
    [completionOptions]
  );

  const handleChange = useCallback(
    (newValue: string) => {
      if (newValue !== customQuery) {
        setCustomQuery(newValue);
      }
    },
    [customQuery, setCustomQuery]
  );

  const extensions = useMemo(() => {
    if (customQuery && customQuery.startsWith("/ai ")) {
      return [autocompletion({ override: [myCompletions] })];
    } else {
      return [SQLite, sql(), autocompletion({ override: [myCompletions] })];
    }
  }, [myCompletions, customQuery]);

  return (
    <CodeMirror
      value={customQuery}
      height="100%"
      extensions={extensions}
      onChange={handleChange}
      className="h-full w-full"
      theme={theme === "dark" ? darcula : "light"}
    />
  );
}

export default CustomSQLTextarea;
