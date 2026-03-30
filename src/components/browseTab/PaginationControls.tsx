import useDatabaseWorker from "@/hooks/useWorker";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import usePanelManager from "@/hooks/usePanel";

import { Button } from "@/components/ui/button";

import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderOutputIcon,
  PlusIcon
} from "lucide-react";

function PaginationControls() {
  const { handlePageChange, handleExport } = useDatabaseWorker();
  const { isInserting, handleInsert } = usePanelManager();
  const offset = useDatabaseStore((state) => state.offset);
  const limit = useDatabaseStore((state) => state.limit);
  const maxSize = useDatabaseStore((state) => state.maxSize);
  const isDataLoading = useDatabaseStore((state) => state.isDataLoading);
  const isView = useDatabaseStore(
    (state) => state.tablesSchema[state.currentTable!]?.type === "view"
  );

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(maxSize / limit);

  return (
    <footer
      className="bg-background flex w-full items-center justify-between border-t shadow-sm"
      id="paginationControls"
      role="contentinfo"
      aria-label="Table pagination and actions"
    >
      <section className="bg-primary/10 flex h-full grow items-center gap-2 p-1">
        <nav
          className="flex items-center rounded-md border shadow-sm"
          role="navigation"
          aria-label="Table pagination"
        >
          <Button
            onClick={() => handlePageChange("first")}
            disabled={offset === 0 || isDataLoading || !maxSize}
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-l-md rounded-r-none border-r"
            aria-label={`Go to first page (page 1 of ${totalPages})`}
          >
            <ChevronFirstIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            onClick={() => handlePageChange("prev")}
            disabled={offset === 0 || isDataLoading || !maxSize}
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-none border-r"
            aria-label={`Go to previous page (page ${currentPage - 1} of ${totalPages})`}
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div
            className="flex items-center justify-center px-3 text-xs font-medium"
            role="status"
            aria-live="polite"
            aria-label={
              maxSize
                ? `Showing rows ${offset + 1} to ${offset + limit > maxSize ? maxSize : offset + limit} of ${maxSize} total rows, page ${currentPage} of ${totalPages}`
                : "No data available"
            }
          >
            {maxSize ? (
              <span aria-hidden="true">
                {offset + 1}
                <span className="text-primary/50 mx-1">-</span>
                {offset + limit > maxSize ? maxSize : offset + limit}
                <span className="text-primary/50 mx-1">of</span>
                {maxSize}
              </span>
            ) : (
              <span>No data</span>
            )}
          </div>
          <Button
            onClick={() => handlePageChange("next")}
            disabled={offset + limit >= maxSize || isDataLoading || !maxSize}
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-none border-l"
            aria-label={`Go to next page (page ${currentPage + 1} of ${totalPages})`}
          >
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            onClick={() => handlePageChange("last")}
            disabled={offset + limit >= maxSize || isDataLoading || !maxSize}
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-l-none rounded-r-md border-l"
            aria-label={`Go to last page (page ${totalPages} of ${totalPages})`}
          >
            <ChevronLastIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      </section>
      <section
        className="bg-primary/10 hidden h-full items-center gap-1 p-2 md:flex"
        role="group"
        aria-label="Table actions"
      >
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs font-medium shadow-sm"
          onClick={handleInsert}
          disabled={isInserting || isView}
          aria-label={
            isView ? "Cannot insert rows in views" : "Insert new row into table"
          }
          aria-describedby={isView ? "insert-disabled-reason" : undefined}
        >
          <PlusIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          Insert row
        </Button>
        {isView && (
          <span id="insert-disabled-reason" className="sr-only">
            Insert is disabled because this is a database view, not a table
          </span>
        )}
        <Button
          onClick={() => handleExport("current")}
          size="sm"
          variant="outline"
          className="h-8 text-xs font-medium shadow-sm"
          aria-label="Export current table data as CSV file"
        >
          <FolderOutputIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          Export data
        </Button>
      </section>
    </footer>
  );
}

export default PaginationControls;
