import { useCallback, useMemo, useRef } from "react";
import type { GridImperativeAPI } from "react-window";
import type { CustomQueryResult } from "@/types";

const ROW_HEIGHT = 36;
const MIN_COLUMN_WIDTH = 120;

export function useQueryGridMetrics(
  customQueryResult: CustomQueryResult | null
) {
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<GridImperativeAPI>(null);

  const columnWidths = useMemo(() => {
    if (!customQueryResult) {
      return [];
    }

    const cols = customQueryResult.columns;
    const colCount = cols.length;
    const sample = customQueryResult.data.slice(0, 100);
    const maxLens = new Array<number>(colCount);

    // Seed with header lengths
    for (let c = 0; c < colCount; c++) {
      maxLens[c] = cols[c]?.length ?? 0;
    }

    // Single pass over sampled rows to find max content length per column
    for (let r = 0; r < sample.length; r++) {
      const row = sample[r];
      if (!row) continue;
      for (let c = 0; c < colCount; c++) {
        const val = row[c];
        const len = val != null ? String(val).length : 0;
        if (len > (maxLens[c] ?? 0)) maxLens[c] = len;
      }
    }

    return maxLens.map((len) =>
      Math.max(MIN_COLUMN_WIDTH, Math.min(len * 8 + 32, 300))
    );
  }, [customQueryResult]);

  // Memoize total once so getColumnWidth and getTotalWidth avoid O(n)
  // reduce on every call. Previously each column width lookup ran a full
  // reduce, making the Grid render O(n*m) for n visible × m total columns.
  const totalContentWidth = useMemo(
    () => columnWidths.reduce((sum, width) => sum + width, 0),
    [columnWidths]
  );
  const columnCount = customQueryResult?.columns.length ?? 0;

  const getColumnWidth = useCallback(
    (columnIndex: number, containerWidth?: number) => {
      if (!columnWidths[columnIndex]) {
        return MIN_COLUMN_WIDTH;
      }

      const contentBasedWidth = columnWidths[columnIndex];
      if (!containerWidth || totalContentWidth >= containerWidth) {
        return contentBasedWidth;
      }

      return (
        contentBasedWidth + (containerWidth - totalContentWidth) / columnCount
      );
    },
    [columnWidths, totalContentWidth, columnCount]
  );

  const getTotalWidth = useCallback(
    (containerWidth: number) => {
      if (columnWidths.length === 0) {
        return containerWidth;
      }

      return Math.max(totalContentWidth, containerWidth);
    },
    [columnWidths, totalContentWidth]
  );

  // Sync horizontal scroll between the static header and the virtualised grid.
  // Uses the Grid's onScroll callback instead of a DOM effect, avoiding
  // addEventListener/removeEventListener churn on every render.
  const handleGridScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (headerScrollRef.current && event.currentTarget) {
        headerScrollRef.current.scrollLeft = event.currentTarget.scrollLeft;
      }
    },
    []
  );

  return {
    gridRef,
    handleGridScroll,
    headerScrollRef,
    getColumnWidth,
    getRowHeight: () => ROW_HEIGHT,
    getTotalWidth,
    rowHeight: ROW_HEIGHT
  };
}
