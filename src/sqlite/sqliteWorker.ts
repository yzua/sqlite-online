import type { WorkerEvent } from "@/types";
import Sqlite from "./core";
import {
  cleanupInstance,
  deleteRow,
  emitDownloadComplete,
  emitExportComplete,
  emitInitComplete,
  emitInsertComplete,
  emitQueryComplete,
  emitQueryError,
  emitRowMutationComplete,
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

self.onmessage = async (event: MessageEvent<WorkerEvent>) => {
  const { action, payload } = event.data;

  // Create a new database instance
  if (action === "init") {
    try {
      // Clean up existing instance first
      cleanup();

      instance = await Sqlite.create();
      emitInitComplete(self.postMessage.bind(self), instance);

      return;
    } catch (error) {
      console.error("Worker: Failed to initialize database:", error);
      emitQueryError(
        self.postMessage.bind(self),
        new Error(
          `Failed to initialize database: ${error instanceof Error ? error.message : String(error)}`
        )
      );
      return;
    }
  }

  // Check if the database instance is initialized
  if (instance === null) {
    emitQueryError(
      self.postMessage.bind(self),
      new Error("Database is not initialized")
    );
    return;
  }

  try {
    // Updates the instance from user-uploaded file
    switch (action) {
      case "openFile": {
        // Clean up existing instance first
        cleanup();

        instance = await Sqlite.open(new Uint8Array(payload.file));

        if (instance.firstTable === null) {
          throw new Error("Database is empty");
        }

        emitInitComplete(self.postMessage.bind(self), instance);

        break;
      }
      // Refreshes the current table data
      // Gets the table data for the current table/table-options
      case "refresh":
      case "getTableData": {
        const [results, maxSize] = loadCurrentTable(instance, payload);
        emitQueryComplete(self.postMessage.bind(self), results, maxSize);

        break;
      }
      // Executes a custom query
      // User for user-typed queries
      case "exec": {
        executeStatement(
          instance,
          payload.query,
          payload,
          self.postMessage.bind(self)
        );

        break;
      }
      // Executes multiple SQL statements as a batch
      case "execBatch": {
        executeBatchStatements(
          instance,
          payload.queries,
          payload,
          self.postMessage.bind(self)
        );

        break;
      }
      // Downloads the database as bytes
      case "download": {
        emitDownloadComplete(self.postMessage.bind(self), instance);

        break;
      }
      // Updates the values of a row in a table
      case "update": {
        updateRow(instance, payload);
        emitRowMutationComplete(self.postMessage.bind(self), "updated");

        break;
      }
      // Deletes a row from a table
      case "delete": {
        deleteRow(instance, payload);
        emitRowMutationComplete(self.postMessage.bind(self), "deleted");

        break;
      }
      // Inserts a row into a table
      case "insert": {
        insertRow(instance, payload);
        emitInsertComplete(self.postMessage.bind(self));

        break;
      }
      // Exports as CSV
      // It have 2 types of exports (table, current data)
      // Current data is the current page of data
      case "export": {
        const {
          table,
          filters,
          sorters,
          limit,
          offset,
          exportType,
          customQuery
        } = payload;

        const results = exportResults(instance, {
          table,
          filters,
          sorters,
          limit,
          offset,
          exportType,
          customQuery
        });

        emitExportComplete(self.postMessage.bind(self), results);

        break;
      }
      // Other unhandled actions
      default:
        console.warn("Unknown worker action:", action);
    }
  } catch (error) {
    emitQueryError(self.postMessage.bind(self), error);
  }
};
