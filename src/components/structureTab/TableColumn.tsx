import { memo } from "react";

import type { TableSchemaRow } from "@/types";

import { Span } from "@/components/ui/span";
import ColumnIcon from "@/components/table/ColumnIcon";

interface TableColumnProps {
  columnSchema: TableSchemaRow;
}

const TableColumn = memo(({ columnSchema }: TableColumnProps) => {
  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center">
        <ColumnIcon columnSchema={columnSchema} />
        <span className="text-primary/60 ml-1 text-xs">
          {columnSchema.name}
        </span>
      </div>
      <Span className="text-primary/60 text-xs whitespace-nowrap">
        <span className="text-primary/50 bg-primary/5 rounded-full px-2 py-0.5 text-xs">
          {columnSchema.type}
        </span>
      </Span>
    </div>
  );
});

export default TableColumn;
