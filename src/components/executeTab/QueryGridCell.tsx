import type { CSSProperties } from "react";
import Badge from "@/components/ui/badge";
import { Span } from "@/components/ui/span";
import type { CustomQueryResult } from "@/types";

export interface QueryGridCellCustomProps {
  data: CustomQueryResult["data"];
}

interface QueryGridCellProps extends QueryGridCellCustomProps {
  ariaAttributes: {
    "aria-colindex": number;
    role: "gridcell";
  };
  columnIndex: number;
  rowIndex: number;
  style: CSSProperties;
}

function QueryGridCell({
  ariaAttributes,
  columnIndex,
  rowIndex,
  style,
  data
}: QueryGridCellProps) {
  const row = data[rowIndex];
  const value = row?.[columnIndex] ?? null;

  return (
    <div
      style={style}
      className="border-primary/5 hover:bg-primary/5 flex items-center border-t border-r p-2"
      {...ariaAttributes}
    >
      {value !== null ? (
        <Span className="truncate text-xs">{String(value)}</Span>
      ) : (
        <Badge>NULL</Badge>
      )}
    </div>
  );
}

export default QueryGridCell;
