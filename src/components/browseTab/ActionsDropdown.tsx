import {
  ChevronDownIcon,
  FilterXIcon,
  FolderOutputIcon,
  ListRestartIcon,
  PlusIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import usePanelManager from "@/hooks/usePanel";
import {
  selectIsCurrentTableView,
  useDatabaseStore
} from "@/store/useDatabaseStore";
import type { Filters, Sorters } from "@/types";
import { useBrowseActions } from "./useBrowseActions";

interface ActionDropdownProps {
  filters: Filters;
  sorters: Sorters;
}

function ActionsDropdown({ filters, sorters }: Readonly<ActionDropdownProps>) {
  const { isInserting, handleInsert } = usePanelManager();
  const isView = useDatabaseStore(selectIsCurrentTableView);
  const { handleClearFilters, handleResetSorters, handleExport } =
    useBrowseActions();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">
          Actions <ChevronDownIcon className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={handleClearFilters}
            disabled={filters == null}
            title="Clear applied filters"
          >
            <FilterXIcon className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={handleResetSorters}
            disabled={sorters == null}
            title="Reset sorting"
          >
            <ListRestartIcon className="mr-1 h-3 w-3" />
            Reset sorting
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={handleInsert}
            disabled={isInserting || isView}
            title="Insert a new row"
          >
            <PlusIcon className="mr-1 h-3 w-3" />
            Insert row
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => handleExport("table")}
            title="Export the current table as CSV"
          >
            <FolderOutputIcon className="mr-1 h-3 w-3" />
            Export table
          </Button>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs"
            onClick={() => handleExport("current")}
            title="Export the current data as CSV"
          >
            <FolderOutputIcon className="mr-1 h-3 w-3" />
            Export data
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ActionsDropdown;
