import usePanelManager from "@/hooks/usePanel";
import { useDatabaseStore } from "@/store/useDatabaseStore";

import type { exportTypes, Filters, Sorters } from "@/types";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import {
  ChevronDownIcon,
  FilterXIcon,
  FolderOutputIcon,
  ListRestartIcon,
  PlusIcon
} from "lucide-react";

interface ActionDropdownProps {
  setFilters: (filters: Filters) => void;
  setSorters: (sorters: Sorters) => void;
  filters: Filters;
  sorters: Sorters;
  handleExport: (exportType: exportTypes) => void;
}

function ActionsDropdown({
  setFilters,
  setSorters,
  filters,
  sorters,
  handleExport
}: Readonly<ActionDropdownProps>) {
  const { isInserting, handleInsert, setSelectedRowObject } = usePanelManager();
  const isView = useDatabaseStore(
    (state) => state.tablesSchema[state.currentTable!]?.type === "view"
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          Actions <ChevronDownIcon className="ml-1 h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-40">
        <DropdownMenuItem asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-start text-xs"
            onClick={() => {
              setFilters(null);
              setSelectedRowObject(null);
            }}
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
            className="h-8 w-full justify-start text-xs"
            onClick={() => {
              setSorters(null);
              setSelectedRowObject(null);
            }}
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
            className="h-8 w-full justify-start text-xs"
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
            className="h-8 w-full justify-start text-xs"
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
            className="h-8 w-full justify-start text-xs"
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
