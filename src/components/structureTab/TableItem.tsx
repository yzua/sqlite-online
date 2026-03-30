import { memo, useCallback } from "react";

import { cn } from "@/lib/utils";
import type { TableSchemaRow } from "@/types";

import TableColumn from "./TableColumn";
import ToggleChevron from "./common/ToggleChevron";
import { EyeIcon } from "lucide-react";

interface TableItemProps {
  name: string;
  table: { schema: TableSchemaRow[]; type: "table" | "view" };
  expanded: boolean;
  toggleTable: (tableName: string) => void;
}

const TableItem = memo(
  ({ name, table, expanded, toggleTable }: TableItemProps) => {
    const handleToggle = useCallback(
      () => toggleTable(name),
      [name, toggleTable]
    );

    return (
      <article>
        <button
          className={cn(
            "flex cursor-pointer items-center rounded px-1.5 py-1 transition-all hover:ml-2",
            expanded && "ml-1"
          )}
          onClick={handleToggle}
          aria-expanded={expanded}
        >
          <div className="flex h-5 w-5 items-center justify-center">
            <ToggleChevron expanded={expanded} />
          </div>
          <span className="flex items-center gap-1 capitalize">
            {table.type === "view" && <EyeIcon className="h-4 w-4" />}
            <span className="text-sm">{name}</span>
            <span className="text-primary/50 text-xs">
              ({table.schema.length})
            </span>
          </span>
        </button>

        {expanded && (
          <div className="border-primary/20 mt-1 mb-2 ml-4 flex flex-col gap-1 space-y-0.5 border-l-2 pl-2">
            {table.schema.map((columnSchema) => (
              <TableColumn key={columnSchema.cid} columnSchema={columnSchema} />
            ))}
          </div>
        )}
      </article>
    );
  }
);

export default TableItem;
