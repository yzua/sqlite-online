import { useCallback } from "react";
import type { SqlValue } from "sql.js";
import { useShallow } from "zustand/react/shallow";
import ColumnIcon from "@/components/table/ColumnIcon";
import FilterInput from "@/components/table/FilterInput";
import { Span } from "@/components/ui/span";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import usePanelManager from "@/hooks/usePanel";
import useDatabaseWorker from "@/hooks/useWorker";
import {
  selectBrowseTableState,
  useDatabaseStore
} from "@/store/useDatabaseStore";
import SorterButton from "../table/SorterButton";
import BrowseTableEmptyState from "./BrowseTableEmptyState";
import BrowseTableRow from "./BrowseTableRow";
import { getRowMeta } from "./rowMeta";
import { useBrowseActions } from "./useBrowseActions";

function DataTable() {
  const { data, columns, currentTable, currentTableSchema, filters, sorters } =
    useDatabaseStore(useShallow(selectBrowseTableState));

  const { handleQueryFilter } = useDatabaseWorker();
  const { handleRowClick, selectedRowObject } = usePanelManager();
  const { handleClearFilters } = useBrowseActions();

  const getRowKey = useCallback(
    (row: SqlValue[]) => {
      const { primaryValue, displayData } = getRowMeta(row, currentTableSchema);
      return primaryValue != null
        ? String(primaryValue)
        : displayData.map((cell) => String(cell)).join("|");
    },
    [currentTableSchema]
  );

  return (
    <section aria-label="Database table data">
      <Table
        role="table"
        aria-label={
          currentTable ? `Data from ${currentTable} table` : "Database table"
        }
      >
        <TableHeader>
          <TableRow className="bg-primary/5" role="row">
            {columns && currentTableSchema ? (
              columns.map((column, index) => (
                <TableHead
                  key={column ?? `column-${index}`}
                  className="p-1 text-xs"
                  role="columnheader"
                  aria-sort={
                    sorters?.[column] === "asc"
                      ? "ascending"
                      : sorters?.[column] === "desc"
                        ? "descending"
                        : "none"
                  }
                >
                  <div className="flex items-center gap-1 py-[1.5px]">
                    <SorterButton column={column} />
                    <Span className="text-foreground font-medium capitalize">
                      {column}
                    </Span>
                    <ColumnIcon
                      columnSchema={currentTableSchema.schema[index] ?? null}
                    />
                  </div>
                  <FilterInput
                    column={column}
                    value={filters?.[column] ?? ""}
                    onChange={handleQueryFilter}
                  />
                </TableHead>
              ))
            ) : (
              <TableHead role="columnheader">
                <p className="text-xs">No columns found</p>
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((row, index) => {
              const rowKey = getRowKey(row) || String(index);
              return (
                <BrowseTableRow
                  key={rowKey}
                  row={row}
                  rowKey={rowKey}
                  rowIndex={index}
                  rowCount={data.length}
                  columns={columns}
                  currentTableSchema={currentTableSchema}
                  selectedRowIndex={selectedRowObject?.index}
                  onSelectRow={handleRowClick}
                />
              );
            })
          ) : (
            <TableRow role="row">
              <TableCell
                colSpan={columns?.length ?? 1}
                className="h-32 text-center"
                role="cell"
                aria-label="No data available"
              >
                <BrowseTableEmptyState
                  filters={filters}
                  onClearFilters={handleClearFilters}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}

export default DataTable;
