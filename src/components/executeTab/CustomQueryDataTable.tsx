import { useDatabaseStore } from "@/store/useDatabaseStore";
import { useRef, useCallback, useEffect, useMemo } from "react";

import { VariableSizeGrid as Grid } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

import { Span } from "@/components/ui/span";
import Badge from "@/components/ui/badge";

import { DatabaseIcon, TableIcon } from "lucide-react";

const ROW_HEIGHT = 36;
const MIN_COLUMN_WIDTH = 120;

function CustomQueryDataTable() {
  const customQueryObject = useDatabaseStore(
    (state) => state.customQueryObject
  );

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<Grid>(null);

  // Memoize column widths calculation to reset when query changes
  const columnWidths = useMemo(() => {
    if (!customQueryObject) return [];

    return customQueryObject.columns.map((column, columnIndex) => {
      const maxContentLength = Math.max(
        column.length,
        ...customQueryObject.data
          .slice(0, 100)
          .map((row) => String(row[columnIndex] || "").length)
      );
      return Math.max(
        MIN_COLUMN_WIDTH,
        Math.min(maxContentLength * 8 + 32, 300)
      );
    });
  }, [customQueryObject]);

  // Calculate column widths based on content and available space
  const getColumnWidth = useCallback(
    (columnIndex: number, containerWidth?: number) => {
      if (!customQueryObject || !columnWidths[columnIndex])
        return MIN_COLUMN_WIDTH;

      const contentBasedWidth = columnWidths[columnIndex];

      // If we have container width, ensure table fills the full width
      if (containerWidth) {
        const totalContentWidth = columnWidths.reduce(
          (sum, width) => sum + width,
          0
        );

        // If content width is less than container, distribute extra space
        if (totalContentWidth < containerWidth) {
          const extraSpace = containerWidth - totalContentWidth;
          const extraPerColumn = extraSpace / customQueryObject.columns.length;
          return contentBasedWidth + extraPerColumn;
        }
      }

      return contentBasedWidth;
    },
    [customQueryObject, columnWidths]
  );

  const getRowHeight = useCallback(() => ROW_HEIGHT, []);

  // Synchronize horizontal scrolling between header and grid
  const handleGridScroll = useCallback(
    ({ scrollLeft }: { scrollLeft: number }) => {
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = scrollLeft;
      }
    },
    []
  );

  const getTotalWidth = useCallback(
    (containerWidth: number) => {
      if (!customQueryObject || !columnWidths.length) return containerWidth;

      const totalContentWidth = columnWidths.reduce(
        (sum, width) => sum + width,
        0
      );
      return Math.max(totalContentWidth, containerWidth);
    },
    [customQueryObject, columnWidths]
  );

  // Reset grid cache when query changes to handle resize properly
  useEffect(() => {
    if (gridRef.current) {
      gridRef.current.resetAfterColumnIndex(0);
    }
  }, [customQueryObject]);

  // Store current width to detect changes
  const currentWidthRef = useRef<number>(0);

  const handleResize = useCallback((width: number) => {
    if (currentWidthRef.current !== width && gridRef.current) {
      currentWidthRef.current = width;
      // Small delay to ensure the grid has updated
      setTimeout(() => {
        if (gridRef.current) {
          gridRef.current.resetAfterColumnIndex(0);
        }
      }, 0);
    }
  }, []);

  if (!customQueryObject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="bg-primary/10 rounded-full p-4">
          <DatabaseIcon className="text-primary/70 h-8 w-8" />
        </div>
        <div className="text-center">
          <h3 className="mb-1 font-medium">No Query Results</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Execute a SQL query to view the results here
          </p>
        </div>
      </div>
    );
  }

  if (!customQueryObject.data || customQueryObject.data.length === 0) {
    return (
      <div className="h-full shadow-sm">
        <div className="bg-primary/5 border-b p-3">
          <div className="flex items-center gap-2">
            <TableIcon className="text-primary/70 h-4 w-4" />
            <h3 className="text-sm font-medium">Query Results</h3>
            <span className="bg-primary/10 rounded-full px-2 py-0.5 text-xs">
              {customQueryObject.columns.length} columns
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="bg-primary/5 mb-4 rounded-full p-4">
            <TableIcon className="text-primary/50 h-6 w-6" />
          </div>
          <p className="text-md mb-1 font-medium">Query returned no results</p>
          <p className="text-muted-foreground text-sm">
            Your query executed successfully but returned no data
          </p>
        </div>
      </div>
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
                    height: ROW_HEIGHT,
                    width: width
                  }}
                >
                  <div className="flex" style={{ width: tableWidth }}>
                    {customQueryObject.columns.map((column, columnIndex) => (
                      <div
                        key={`${column}-${columnIndex}`}
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
                  height={height - ROW_HEIGHT}
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
                    const value = customQueryObject.data[rowIndex][columnIndex];
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
