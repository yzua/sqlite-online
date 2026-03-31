import type { SqlValue } from "sql.js";
import Badge from "@/components/ui/badge";
import { Span } from "@/components/ui/span";
import { TableCell, TableRow } from "@/components/ui/table";
import type { TableSchema } from "@/types";

interface BrowseTableRowProps {
  row: SqlValue[];
  rowKey: string;
  rowIndex: number;
  rowCount: number;
  columns: string[] | null;
  currentTableSchema: TableSchema[string] | undefined;
  selectedRowIndex: number | undefined;
  onSelectRow: (
    row: SqlValue[],
    rowIndex: number,
    primaryValue: SqlValue
  ) => void;
}

function BrowseTableRow({
  row,
  rowKey,
  rowIndex,
  rowCount,
  columns,
  currentTableSchema,
  selectedRowIndex,
  onSelectRow
}: BrowseTableRowProps) {
  const isView = currentTableSchema?.type === "view";
  const primaryKey = currentTableSchema?.primaryKey;
  const primaryValue = primaryKey && !isView ? (row[0] ?? null) : null;
  const displayData = primaryKey && !isView ? row.slice(1) : row;

  const handleSelect = () => {
    onSelectRow(displayData, rowIndex, primaryValue);
  };

  return (
    <TableRow
      key={rowKey}
      onClick={handleSelect}
      className="hover:bg-primary/5 focus:bg-primary/5 data-[state=selected]:bg-primary/5 focus:ring-ring cursor-pointer text-xs focus:ring-2 focus:ring-offset-1 focus:outline-none"
      role="row"
      data-state={selectedRowIndex === rowIndex ? "selected" : undefined}
      tabIndex={0}
      aria-label={`Row ${rowIndex + 1} of ${rowCount}, click to edit`}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleSelect();
        }
      }}
    >
      {displayData.map((value, columnIndex) => (
        <TableCell
          key={JSON.stringify({
            column: columns?.[columnIndex] ?? null,
            schemaName: currentTableSchema?.schema[columnIndex]?.name ?? null,
            schemaType: currentTableSchema?.schema[columnIndex]?.type ?? null,
            value
          })}
          className="border-primary/5 border-t p-2"
          role="cell"
          aria-label={`${columns?.[columnIndex] || `Column ${columnIndex + 1}`}: ${
            value === null
              ? "NULL"
              : currentTableSchema?.schema[columnIndex]?.type === "BLOB"
                ? "BLOB data"
                : String(value)
          }`}
        >
          {value === null ? (
            <Badge aria-label="NULL value">NULL</Badge>
          ) : currentTableSchema?.schema[columnIndex]?.type === "BLOB" ? (
            <Badge aria-label="Binary data">BLOB</Badge>
          ) : (
            <Span className="text-xs">{String(value)}</Span>
          )}
        </TableCell>
      ))}
    </TableRow>
  );
}

export default BrowseTableRow;
