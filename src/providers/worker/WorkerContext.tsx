import { createContext } from "react";
import type { DatabaseWorkerApi } from "./types";

const DatabaseWorkerContext = createContext<DatabaseWorkerApi | undefined>(
  undefined
);

export default DatabaseWorkerContext;
