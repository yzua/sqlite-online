import { createContext } from "react";

import type { EditTypes, ExportTypes } from "@/types";

interface DatabaseWorkerContextProps {
  workerRef: { current: Worker | null };
  handleFileUpload: (file: File) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownload: () => void;
  handleTableChange: (selectedTable: string) => void;
  handleQueryFilter: (column: string, value: string) => void;
  handleQuerySorter: (column: string) => void;
  handlePageChange: (type: "next" | "prev" | "first" | "last" | number) => void;
  handleExport: (exportType: ExportTypes) => void;
  handleQueryExecute: () => void;
  handleEditSubmit: (type: EditTypes) => void;
}

const DatabaseWorkerContext = createContext<
  DatabaseWorkerContextProps | undefined
>(undefined);

export default DatabaseWorkerContext;
