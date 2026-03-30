import { DatabaseIcon, FilterXIcon } from "lucide-react";
import { useMemo } from "react";
import ColumnIcon from "@/components/table/ColumnIcon";
import FilterInput from "@/components/table/FilterInput";
import Badge from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useDatabaseStore } from "@/store/useDatabaseStore";
import SorterButton from "../table/SorterButton";

function DataTable() {
  const data = useDatabaseStore((state) => state.data);
  const columns = useDatabaseStore((state) => state.columns);
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const tablesSchema = useDatabaseStore((state) => state.tablesSchema);
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const setFilters = useDatabaseStore((state) => state.setFilters);
  const currentTableSchema = currentTable
    ? tablesSchema[currentTable]
    : undefined;

  const { handleQueryFilter } = useDatabaseWorker();
  const { handleRowClick, selectedRowObject } = usePanelManager();

  const emptyDataContent = useMemo(
    () => (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-4">
        {filters ? (
          <>
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
              onClick={() => setFilters(null)}
            >
              <FilterXIcon className="mr-1 h-3 w-3" />
              Clear filters
            </Button>
          </>
        ) : (
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
        )}
      </div>
    ),
    [filters, setFilters]
  );

  const memoizedFilterInput = useMemo(() => {
    return (columns || []).map((column) => (
      <FilterInput
        key={column}
        column={column}
        value={filters?.[column] ?? ""}
        onChange={handleQueryFilter}
      />
    ));
  }, [columns, filters, handleQueryFilter]);

  return (
    <section aria-label="Database table data" aria-live="polite">
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
                  key={column}
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
                  {memoizedFilterInput?.[index]}
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
            data.map((row, i) => {
              const isView = currentTableSchema?.type === "view";
              const primaryKey = currentTableSchema?.primaryKey;
              const primaryValue =
                primaryKey && !isView ? (row[0] ?? null) : null;
              const displayData = primaryKey && !isView ? row.slice(1) : row;

              return (
                <TableRow
                  key={
                    primaryValue !== null
                      ? String(primaryValue)
                      : row.map((cell) => String(cell)).join("|")
                  }
                  onClick={() => handleRowClick(displayData, i, primaryValue)}
                  className="hover:bg-primary/5 focus:bg-primary/5 data-[state=selected]:bg-primary/5 focus:ring-ring cursor-pointer text-xs focus:ring-2 focus:ring-offset-1 focus:outline-none"
                  role="row"
                  data-state={
                    selectedRowObject?.index === i ? "selected" : undefined
                  }
                  tabIndex={0}
                  aria-label={`Row ${i + 1} of ${data.length}, click to edit`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRowClick(displayData, i, primaryValue);
                    }
                  }}
                >
                  {displayData.map((value, j) => (
                    <TableCell
                      key={currentTableSchema?.schema[j]?.name ?? String(value)}
                      className="border-primary/5 border-t p-2"
                      role="cell"
                      aria-label={`${columns?.[j] || `Column ${j + 1}`}: ${
                        value === null
                          ? "NULL"
                          : currentTableSchema?.schema[j]?.type === "BLOB"
                            ? "BLOB data"
                            : String(value)
                      }`}
                    >
                      {value === null ? (
                        <Badge aria-label="NULL value">
                          {value === null ? "NULL" : JSON.stringify(value)}
                        </Badge>
                      ) : currentTableSchema?.schema[j]?.type === "BLOB" ? (
                        <Badge aria-label="Binary data">BLOB</Badge>
                      ) : (
                        <Span className="text-xs">{value}</Span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
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
                {emptyDataContent}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </section>
  );
}

export default DataTable;
