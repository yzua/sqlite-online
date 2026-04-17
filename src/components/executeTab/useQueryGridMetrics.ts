import { useCallback, useEffect, useMemo, useRef } from "react";
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

    return customQueryResult.columns.map((column, columnIndex) => {
      const maxContentLength = Math.max(
        column.length,
        ...customQueryResult.data
          .slice(0, 100)
          .map((row) => String(row[columnIndex] || "").length)
      );

      return Math.max(
        MIN_COLUMN_WIDTH,
        Math.min(maxContentLength * 8 + 32, 300)
      );
    });
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

  useEffect(() => {
    const element = gridRef.current?.element;
    if (!element) {
      return;
    }

    const handleScroll = () => {
      if (headerScrollRef.current) {
        headerScrollRef.current.scrollLeft = element.scrollLeft;
      }
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      element.removeEventListener("scroll", handleScroll);
    };
  });

  return {
    gridRef,
    headerScrollRef,
    getColumnWidth,
    getRowHeight: () => ROW_HEIGHT,
    getTotalWidth,
    rowHeight: ROW_HEIGHT
  };
}
