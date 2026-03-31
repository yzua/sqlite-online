import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderOutputIcon,
  PlusIcon
} from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import usePanelManager from "@/hooks/usePanel";
import useDatabaseWorker from "@/hooks/useWorker";
import {
  selectIsCurrentTableView,
  selectPaginationState,
  useDatabaseStore
} from "@/store/useDatabaseStore";
import {
  getCurrentPage,
  getTotalPages,
  getVisibleRange,
  isAtFirstPage,
  isAtLastPage
} from "./paginationUtils";

function PaginationControls() {
  const { handlePageChange, handleExport } = useDatabaseWorker();
  const { isInserting, handleInsert } = usePanelManager();
  const { offset, limit, maxSize, isDataLoading } = useDatabaseStore(
    useShallow(selectPaginationState)
  );
  const isView = useDatabaseStore(selectIsCurrentTableView);

  const currentPage = getCurrentPage(offset, limit);
  const totalPages = getTotalPages(maxSize, limit);
  const visibleRange = getVisibleRange(offset, limit, maxSize);
  const atFirstPage = isAtFirstPage(offset);
  const atLastPage = isAtLastPage(offset, limit, maxSize);

  return (
    <div
      className="flex w-full flex-wrap items-center justify-between gap-2 border-t shadow-sm md:flex-nowrap"
      id="paginationControls"
    >
      <section className="flex min-w-0 grow items-center gap-2 p-1">
        <nav
          className="flex min-w-0 items-center rounded-md border shadow-sm"
          aria-label="Table pagination"
        >
          <Button
            onClick={() => handlePageChange("first")}
            disabled={atFirstPage || isDataLoading || !maxSize}
            size="icon"
            variant="ghost"
            className="rounded-l-md rounded-r-none border-r"
            aria-label={`Go to first page (page 1 of ${totalPages})`}
          >
            <ChevronFirstIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            onClick={() => handlePageChange("prev")}
            disabled={atFirstPage || isDataLoading || !maxSize}
            size="icon"
            variant="ghost"
            className="rounded-none border-r"
            aria-label={`Go to previous page (page ${currentPage - 1} of ${totalPages})`}
          >
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="flex min-w-0 items-center justify-center px-3 text-sm font-medium">
            {maxSize ? (
              <>
                <span className="sr-only">
                  Showing rows {visibleRange.start} to {visibleRange.end} of{" "}
                  {maxSize}
                </span>
                {visibleRange.start}
                <span className="text-primary/50 mx-1">-</span>
                {visibleRange.end}
                <span className="text-primary/50 mx-1">of</span>
                {maxSize}
              </>
            ) : (
              <span>No data</span>
            )}
          </div>
          <Button
            onClick={() => handlePageChange("next")}
            disabled={atLastPage || isDataLoading || !maxSize}
            size="icon"
            variant="ghost"
            className="rounded-none border-l"
            aria-label={`Go to next page (page ${currentPage + 1} of ${totalPages})`}
          >
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            onClick={() => handlePageChange("last")}
            disabled={atLastPage || isDataLoading || !maxSize}
            size="icon"
            variant="ghost"
            className="rounded-l-none rounded-r-md border-l"
            aria-label={`Go to last page (page ${totalPages} of ${totalPages})`}
          >
            <ChevronLastIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      </section>
      <section
        className="hidden items-center gap-1 p-1 md:flex"
        aria-label="Table actions"
      >
        <Button
          size="sm"
          variant="outline"
          className="text-xs font-medium shadow-sm"
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
          className="text-xs font-medium shadow-sm"
          aria-label="Export current table data as CSV file"
        >
          <FolderOutputIcon className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
          Export data
        </Button>
      </section>
    </div>
  );
}

export default PaginationControls;
