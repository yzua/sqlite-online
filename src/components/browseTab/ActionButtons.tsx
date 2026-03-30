import { useDatabaseStore } from "@/store/useDatabaseStore";
import usePanelManager from "@/hooks/usePanel";
import useDatabaseWorker from "@/hooks/useWorker";

import type { Filters, Sorters } from "@/types";

import { Button } from "@/components/ui/button";
import ActionsDropdown from "./ActionsDropdown";

import { FilterXIcon, FolderOutputIcon, ListRestartIcon } from "lucide-react";

interface ActionButtonsProps {
  filters: Filters;
  sorters: Sorters;
}

function ActionButtons({ filters, sorters }: Readonly<ActionButtonsProps>) {
  const setFilters = useDatabaseStore((state) => state.setFilters);
  const setSorters = useDatabaseStore((state) => state.setSorters);
  const { handleExport } = useDatabaseWorker();
  const { setSelectedRowObject } = usePanelManager();

  const hasFilters = filters != null;
  const hasSorters = sorters != null;
  const filterCount = hasFilters ? Object.keys(filters).length : 0;
  const sorterCount = hasSorters ? Object.keys(sorters).length : 0;

  return (
    <>
      <div
        className="hidden items-center gap-1 md:flex"
        role="group"
        aria-label="Table actions"
      >
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => {
            setFilters(null);
            setSelectedRowObject(null);
          }}
          disabled={!hasFilters}
          aria-label={
            hasFilters
              ? `Clear ${filterCount} active filter${filterCount !== 1 ? "s" : ""}`
              : "No filters to clear"
          }
          aria-describedby="clear-filters-description"
        >
          <FilterXIcon className="mr-1 h-3 w-3" aria-hidden="true" />
          Clear filters
        </Button>
        <span id="clear-filters-description" className="sr-only">
          {hasFilters
            ? `${filterCount} filter${filterCount !== 1 ? "s" : ""} currently applied`
            : "No filters currently applied"}
        </span>

        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => {
            setSorters(null);
            setSelectedRowObject(null);
          }}
          disabled={!hasSorters}
          aria-label={
            hasSorters
              ? `Reset ${sorterCount} active sort${sorterCount !== 1 ? "s" : ""}`
              : "No sorting to reset"
          }
          aria-describedby="reset-sorting-description"
        >
          <ListRestartIcon className="mr-1 h-3 w-3" aria-hidden="true" />
          Reset sorting
        </Button>
        <span id="reset-sorting-description" className="sr-only">
          {hasSorters
            ? `${sorterCount} column${sorterCount !== 1 ? "s" : ""} currently sorted`
            : "No sorting currently applied"}
        </span>

        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs"
          onClick={() => handleExport("table")}
          aria-label="Export entire table as CSV file"
        >
          <FolderOutputIcon className="mr-1 h-3 w-3" aria-hidden="true" />
          Export table
        </Button>
      </div>
      <div className="md:hidden">
        <ActionsDropdown
          setFilters={setFilters}
          setSorters={setSorters}
          filters={filters}
          sorters={sorters}
          handleExport={handleExport}
        />
      </div>
    </>
  );
}

export default ActionButtons;
