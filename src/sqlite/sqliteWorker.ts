import { tableDataCache } from "@/lib/queryCache";
import type { WorkerEvent } from "@/types";
import Sqlite from "./core";
import {
  cleanupInstance,
  deleteRow,
  emitDownloadComplete,
  emitExportComplete,
  emitInitComplete,
  emitQueryComplete,
  emitQueryError,
  executeBatchStatements,
  executeStatement,
  exportResults,
  insertRow,
  loadCurrentTable,
  updateRow
} from "./workerRuntime";

// Global variable to store the database instance
let instance: Sqlite | null = null;

function cleanup() {
  instance = cleanupInstance(instance);
}

function assertNever(action: never): never {
  throw new Error(`Unknown worker action: ${action}`);
}

self.onmessage = async (event: MessageEvent<WorkerEvent>) => {
  const { action, payload } = event.data;
  // DedicatedWorkerGlobalScope.postMessage accepts (message, transfer?) but
  // TypeScript resolves self.postMessage to the Window overload in this file.
  const post = self.postMessage.bind(self) as (
    message: unknown,
    transfer?: Transferable[]
  ) => void;

  // Create a new database instance
  if (action === "init") {
    try {
      // Clean up existing instance first
      cleanup();
      tableDataCache.clear();

      instance = await Sqlite.create();
      emitInitComplete(post, instance);

      return;
    } catch (error) {
      console.error("Worker: Failed to initialize database:", error);
      emitQueryError(
        post,
        new Error(
          `Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }
  }

  // Check if the database instance is initialized
  if (instance === null) {
    emitQueryError(post, new Error("Database is not initialized"));
    return;
  }

  try {
    switch (action) {
      // Updates the instance from user-uploaded file
      case "openFile": {
        cleanup();
        tableDataCache.clear();

        instance = await Sqlite.open(new Uint8Array(payload.file));

        if (instance.firstTable === null) {
          throw new Error("Database is empty");
        }

        emitInitComplete(post, instance);

        break;
      }
      // Refreshes the current table data
      case "refresh":
      case "getTableData": {
        const [results, maxSize] = loadCurrentTable(instance, payload);
        emitQueryComplete(post, results, maxSize);

        break;
      }
      // Executes a custom query
      case "exec": {
        executeStatement(instance, payload.query, payload, post);

        break;
      }
      // Executes multiple SQL statements as a batch
      case "execBatch": {
        executeBatchStatements(instance, payload.queries, payload, post);

        break;
      }
      // Downloads the database as bytes
      case "download": {
        emitDownloadComplete(post, instance);

        break;
      }
      // Updates the values of a row in a table
      case "update": {
        updateRow(instance, payload, post);

        break;
      }
      // Deletes a row from a table
      case "delete": {
        deleteRow(instance, payload, post);

        break;
      }
      // Inserts a row into a table
      case "insert": {
        insertRow(instance, payload, post);

        break;
      }
      // Exports as CSV
      // Has 2 types of exports: table data and current page data
      case "export": {
        const results = exportResults(instance, payload);
        emitExportComplete(post, results);

        break;
      }
      default:
        assertNever(action);
    }
  } catch (error) {
    emitQueryError(post, error);
  }
};
