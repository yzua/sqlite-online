import { FilterXIcon, FolderOutputIcon, ListRestartIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import ActionsDropdown from "./ActionsDropdown";
import { useBrowseActions } from "./useBrowseActions";

function ActionButtons() {
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const { handleClearFilters, handleResetSorters, handleExport } =
    useBrowseActions();

  const hasFilters = filters != null;
  const hasSorters = sorters != null;
  const filterCount = hasFilters ? Object.keys(filters).length : 0;
  const sorterCount = hasSorters ? Object.keys(sorters).length : 0;

  return (
    <>
      <section
        className="hidden items-center gap-1 md:flex"
        aria-label="Table actions"
      >
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={handleClearFilters}
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
          className="text-xs"
          onClick={handleResetSorters}
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
          className="text-xs"
          onClick={() => handleExport("table")}
          aria-label="Export entire table as CSV file"
        >
          <FolderOutputIcon className="mr-1 h-3 w-3" aria-hidden="true" />
          Export table
        </Button>
      </section>
      <div className="md:hidden">
        <ActionsDropdown />
      </div>
    </>
  );
}

export default ActionButtons;
