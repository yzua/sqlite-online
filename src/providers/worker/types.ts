import type { EditTypes, ExportTypes } from "@/types";

export type PageChange = "next" | "prev" | "first" | "last" | number;

export interface DatabaseWorkerApi {
  handleFileUpload: (file: File) => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDownload: () => void;
  handleTableChange: (selectedTable: string) => void;
  handleQueryFilter: (column: string, value: string) => void;
  handleQuerySorter: (column: string) => void;
  handlePageChange: (type: PageChange) => void;
  handleExport: (exportType: ExportTypes) => void;
  handleQueryExecute: () => void;
  handleEditSubmit: (type: EditTypes) => void;
}
