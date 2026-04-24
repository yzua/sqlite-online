import { useMemo } from "react";
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

  // Memoize row metadata to avoid per-row array allocations on every render
  const rowMetas = useMemo(() => {
    if (!data) return [];
    return data.map((row) => getRowMeta(row, currentTableSchema));
  }, [data, currentTableSchema]);

  return (
    <section
      aria-label="Database table data"
      className="flex-1 min-h-0 overflow-auto"
    >
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
            rowMetas.map((meta, index) => (
              <BrowseTableRow
                key={meta.rowKey}
                displayData={meta.displayData}
                primaryValue={meta.primaryValue}
                rowKey={meta.rowKey}
                rowIndex={index}
                rowCount={data.length}
                columns={columns}
                currentTableSchema={currentTableSchema}
                isSelected={selectedRowObject?.index === index}
                onSelectRow={handleRowClick}
              />
            ))
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
