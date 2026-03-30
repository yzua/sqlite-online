import { memo, useCallback, useState } from "react";

import type { TableSchema } from "@/types";

import { Button } from "@/components/ui/button";
import TableItem from "./TableItem";
import SectionHeader from "./common/SectionHeader";

import {
  DatabaseIcon,
  ChevronsUpDownIcon,
  ChevronsDownUpIcon
} from "lucide-react";

interface TablesSectionProps {
  tablesSchema: TableSchema;
  expandAllTables: (tablesSchema: TableSchema) => void;
  collapseAllTables: () => void;
  expandedTableSection: boolean;
  toggleTableSection: () => void;
  expandedTables: string[];
  toggleTable: (tableName: string) => void;
}

const TablesSection = memo(
  ({
    tablesSchema,
    expandAllTables,
    collapseAllTables,
    expandedTableSection,
    toggleTableSection,
    expandedTables,
    toggleTable
  }: TablesSectionProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleExpandAll = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        expandAllTables(tablesSchema);
        setIsExpanded(true);
      },
      [expandAllTables, tablesSchema]
    );

    const handleCollapseAll = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        collapseAllTables();
        setIsExpanded(false);
      },
      [collapseAllTables]
    );

    const expandControls = expandedTableSection && (
      <div className="ml-auto flex">
        {isExpanded ? (
          <Button
            className="text-primary hover:bg-primary/5 h-7 rounded px-2 py-0.5 text-xs transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleCollapseAll}
            aria-label="Collapse all tables"
          >
            <ChevronsDownUpIcon className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="text-primary hover:bg-primary/5 h-7 rounded px-2 py-0.5 text-xs transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleExpandAll}
            aria-label="Expand all tables"
          >
            <ChevronsUpDownIcon className="h-4 w-4" />
          </Button>
        )}
      </div>
    );

    return (
      <section>
        <SectionHeader
          title="Tables"
          expanded={expandedTableSection}
          icon={<DatabaseIcon className="mr-2 h-4 w-4" />}
          onToggle={toggleTableSection}
        >
          {expandControls}
        </SectionHeader>

        {expandedTableSection && (
          <div className="space-y-0.5 overflow-y-auto pr-1 pl-2">
            {Object.entries(tablesSchema).map(([tableName, tableData]) => (
              <TableItem
                key={tableName}
                name={tableName}
                table={tableData}
                expanded={expandedTables.includes(tableName)}
                toggleTable={toggleTable}
              />
            ))}
          </div>
        )}
      </section>
    );
  }
);

export default TablesSection;
