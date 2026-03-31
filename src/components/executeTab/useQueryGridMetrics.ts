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

  const getColumnWidth = useCallback(
    (columnIndex: number, containerWidth?: number) => {
      if (!customQueryResult || !columnWidths[columnIndex]) {
        return MIN_COLUMN_WIDTH;
      }

      const contentBasedWidth = columnWidths[columnIndex];
      if (!containerWidth) {
        return contentBasedWidth;
      }

      const totalContentWidth = columnWidths.reduce(
        (sum, width) => sum + width,
        0
      );
      if (totalContentWidth >= containerWidth) {
        return contentBasedWidth;
      }

      return (
        contentBasedWidth +
        (containerWidth - totalContentWidth) / customQueryResult.columns.length
      );
    },
    [customQueryResult, columnWidths]
  );

  const getTotalWidth = useCallback(
    (containerWidth: number) => {
      if (!customQueryResult || columnWidths.length === 0) {
        return containerWidth;
      }

      return Math.max(
        columnWidths.reduce((sum, width) => sum + width, 0),
        containerWidth
      );
    },
    [customQueryResult, columnWidths]
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
