import { DatabaseIcon, FilterXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Filters } from "@/types";

interface BrowseTableEmptyStateProps {
  filters: Filters;
  onClearFilters: () => void;
}

function BrowseTableEmptyState({
  filters,
  onClearFilters
}: BrowseTableEmptyStateProps) {
  if (filters) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-4">
        <div className="text-center">
          <h3 className="mb-1 font-medium">No Data To Show</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            The current filters did not return any results
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="text-xs"
          onClick={onClearFilters}
        >
          <FilterXIcon className="mr-1 h-3 w-3" />
          Clear filters
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
      <div className="bg-primary/10 rounded-full p-4">
        <DatabaseIcon className="text-primary/70 h-8 w-8" />
      </div>
      <div className="text-center">
        <h3 className="mb-1 font-medium">No Data To Show</h3>
        <p className="text-muted-foreground max-w-md text-sm">
          This table does not have any data to display
        </p>
      </div>
    </div>
  );
}

export default BrowseTableEmptyState;
