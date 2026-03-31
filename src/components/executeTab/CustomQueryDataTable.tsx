import { TableIcon } from "lucide-react";
import AutoSizer from "react-virtualized-auto-sizer";
import { VariableSizeGrid as Grid } from "react-window";
import { useShallow } from "zustand/react/shallow";
import Badge from "@/components/ui/badge";
import { Span } from "@/components/ui/span";
import {
  selectExecuteViewState,
  useDatabaseStore
} from "@/store/useDatabaseStore";
import QueryResultsEmptyState from "./QueryResultsEmptyState";
import { useQueryGridMetrics } from "./useQueryGridMetrics";

function CustomQueryDataTable() {
  const { customQuery, customQueryObject } = useDatabaseStore(
    useShallow(selectExecuteViewState)
  );
  const {
    gridRef,
    headerScrollRef,
    getColumnWidth,
    getRowHeight,
    getTotalWidth,
    handleGridScroll,
    handleResize,
    rowHeight
  } = useQueryGridMetrics(customQueryObject);

  if (!customQueryObject) {
    return <QueryResultsEmptyState hasQuery={customQuery.length > 0} />;
  }

  if (customQueryObject.data.length === 0) {
    return (
      <QueryResultsEmptyState
        hasQuery
        columnCount={customQueryObject.columns.length}
      />
    );
  }

  return (
    <div className="flex h-full w-full flex-col shadow-sm">
      <div className="bg-primary/5 flex-shrink-0 border-b p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TableIcon className="text-primary/70 h-4 w-4" />
            <Span className="mr-2 text-sm font-medium text-nowrap">
              Query Results
            </Span>
          </div>
          <div className="flex items-center gap-2">
            <Span className="bg-primary/10 rounded-full px-2 py-0.5 text-xs text-nowrap">
              {customQueryObject.data.length} rows
            </Span>
            <Span className="bg-primary/10 rounded-full px-2 py-0.5 text-xs text-nowrap">
              {customQueryObject.columns.length} columns
            </Span>
          </div>
        </div>
      </div>

      <div className="h-0 min-h-0 flex-grow overflow-hidden">
        <AutoSizer>
          {({ height, width }) => {
            const tableWidth = getTotalWidth(width);

            // Handle resize
            handleResize(width);

            return (
              <div style={{ height, width }} className="flex flex-col">
                {/* Fixed Header with Horizontal Scroll */}
                <div
                  ref={headerScrollRef}
                  className="bg-primary/5 scrollbar-hide overflow-x-auto overflow-y-hidden border-b"
                  style={{
                    height: rowHeight,
                    width: width
                  }}
                >
                  <div className="flex" style={{ width: tableWidth }}>
                    {customQueryObject.columns.map((column, columnIndex) => (
                      <div
                        key={column}
                        className="border-primary/10 flex flex-shrink-0 items-center border-r p-2 text-xs font-medium"
                        style={{ width: getColumnWidth(columnIndex, width) }}
                      >
                        <Span className="text-foreground truncate capitalize">
                          {column}
                        </Span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Virtualized Grid Body */}
                <Grid
                  ref={gridRef}
                  height={height - rowHeight}
                  width={width}
                  columnCount={customQueryObject.columns.length}
                  rowCount={customQueryObject.data.length}
                  columnWidth={(index) => getColumnWidth(index, width)}
                  rowHeight={getRowHeight}
                  onScroll={handleGridScroll}
                  overscanColumnCount={2}
                  overscanRowCount={5}
                  key={`grid-${customQueryObject.columns.join("-")}`}
                >
                  {({ columnIndex, rowIndex, style }) => {
                    const row = customQueryObject.data[rowIndex];
                    const value = row?.[columnIndex] ?? null;

                    return (
                      <div
                        style={style}
                        className="border-primary/5 hover:bg-primary/5 flex items-center border-t border-r p-2"
                      >
                        {value !== null ? (
                          <Span className="truncate text-xs">
                            {String(value)}
                          </Span>
                        ) : (
                          <Badge>NULL</Badge>
                        )}
                      </div>
                    );
                  }}
                </Grid>
              </div>
            );
          }}
        </AutoSizer>
      </div>
    </div>
  );
}

export default CustomQueryDataTable;
