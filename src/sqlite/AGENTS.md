# src/sqlite

SQLite engine, web worker, schema introspection, and SQL utilities. All database
operations run in a web worker via `sql.js` (WebAssembly).

## Files

| File                   | Export                                                | Role                                                                                                                                                                                               |
| ---------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core.ts`              | `Sqlite` (class), `CustomQueryError`                  | Central database abstraction. Private constructor; use `Sqlite.create()` or `Sqlite.open()`. Owns schema state, CRUD, pagination, export, download.                                                |
| `sqliteWorker.ts`      | none                                                  | Web Worker entry point. Singleton `Sqlite` instance. Routes `WorkerEvent` messages to `workerRuntime.ts` handlers.                                                                                 |
| `workerRuntime.ts`     | `emitX` functions, action handlers                    | Pure orchestration between the worker message loop and `Sqlite` class. All `postMessage` responses go through here.                                                                                |
| `schema.ts`            | `readDatabaseSchema`                                  | Schema introspection via `sqlite_master`, `PRAGMA table_info`, `PRAGMA foreign_key_list`. Returns `SchemaSnapshot`.                                                                                |
| `sqlUtils.ts`          | SQL helpers                                           | Pure functions: `normalizeSqlStatement`, `isStructureChangeable`, `sanitizeIdentifier`, `buildWhereClause`, `buildOrderByClause`, `runPreparedQuery`, `runPreparedScalar`, `arrayToCSV`. No state. |
| `sqlite-type-check.ts` | `isDate`, `isBlob`, `isText`, `isBoolean`, `isNumber` | Type-checking predicates for SQLite affinity strings. Used by the UI to choose rendering.                                                                                                          |
| `demo-db.ts`           | `DEMO_DB` (const string)                              | SQL literal seeding the initial in-memory database (Customers, Products, Orders).                                                                                                                  |

## Worker Protocol

Messages use discriminated unions on `action` (see `@/types` for `WorkerEvent`
and `WorkerResponseEvent`).

**Inbound (main -> worker):** `init`, `openFile`, `refresh`, `getTableData`,
`exec`, `execBatch`, `download`, `update`, `delete`, `insert`, `export`.

**Outbound (worker -> main):** `initComplete`, `queryComplete`,
`customQueryComplete`, `updateInstance`, `updateComplete`, `insertComplete`,
`downloadComplete`, `exportComplete`, `queryError`.

## Sqlite Class API

- `static async create()` - New DB with demo data
- `static async open(file: Uint8Array)` - Open from bytes
- `exec(sql)` - Execute SQL, returns `[results, schemaChanged]`
- `download()` - Export as `Uint8Array`
- `getTableData(table, limit, offset, filters?, sorters?)` - Paginated read
- `update(table, columns, values, id)` - Update row by PK
- `delete(table, id)` - Delete row by PK
- `insert(table, columns, values)` - Insert row
- `export(opts)` - Export as CSV

Public properties: `db`, `firstTable`, `tablesSchema`, `indexesSchema`.

## Key Patterns

- **Caching**: `getTableData` checks an LRU cache (100 entries, 5-min TTL) from
  `@/lib/queryCache`. CRUD methods invalidate the table's cache entries.
- **SQL injection prevention**: Identifiers quoted via `sanitizeIdentifier()`.
  Filters use parameterized queries. Limit/offset clamped to integers.
- **Error handling**: Worker wraps all handlers in try/catch -> `emitQueryError`.
  `CustomQueryError` subclass distinguishes user SQL errors from internal ones.
- **Schema re-read**: After `exec()`, `isStructureChangeable()` checks for
  `CREATE`/`DROP`/`ALTER` prefixes to decide whether to re-introspect.

## Dependencies

- `sql.js` (external): Database, QueryExecResult, SqlJsStatic, SqlValue, initSqlJs
- `@/lib/queryCache`: `tableDataCache`
- `@/types`: Filters, IndexSchema, Sorters, TableSchema, WorkerEvent, WorkerResponseEvent

## Guidelines

- Do not touch `sqliteWorker.ts` unless changing the worker message protocol.
- Add new SQL utilities to `sqlUtils.ts`, not inline in `core.ts`.
- Keep `schema.ts` decoupled: it takes an `ExecSql` callback, not a `Sqlite` instance.
- CRUD methods must call `tableDataCache.invalidateTable()` after mutations.
