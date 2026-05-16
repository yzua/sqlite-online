import { useEffect } from "react";
import showToast from "@/components/common/toast";
import { useTableLimit } from "@/hooks/useTableLimit";
import { calculateTableLimit } from "@/lib/calculateTableLimit";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { postWorkerMessage } from "./postWorkerMessage";

/**
 * Fetches table data from the worker whenever browse state changes.
 *
 * Debounces filter changes (100ms) to avoid querying on every keystroke;
 * pagination, table switches, sorters, and resize trigger immediate fetches.
 * Includes a one-shot limit correction after initial render because the first
 * DOM measurement can happen before the browse panel reaches its final height.
 */
export function useTableDataFetch(workerRef: React.RefObject<Worker | null>) {
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const offset = useDatabaseStore((state) => state.offset);

  // Dynamic row limit based on viewport height — updated by ResizeObserver
  const tableLimit = useTableLimit(currentTable);

  // biome-ignore lint/correctness/useExhaustiveDependencies: workerRef is a stable ref — including workerRef.current would cause the effect to fire on every render.
  useEffect(() => {
    if (!currentTable) {
      return;
    }

    const fetchData = (limitOverride?: number) => {
      if (!workerRef.current) {
        showToast("Worker is not initialized", "error");
        return;
      }

      const nextLimit = limitOverride ?? tableLimit;

      // Single setState to batch limit + loading into one subscriber notification.
      const currentLimit = useDatabaseStore.getState().limit;
      useDatabaseStore.setState({
        ...(nextLimit !== currentLimit ? { limit: nextLimit } : {}),
        isDataLoading: true
      });

      postWorkerMessage(workerRef.current, {
        action: "getTableData",
        payload: {
          currentTable,
          filters,
          sorters,
          limit: nextLimit,
          offset
        }
      });
    };

    const correctionHandler =
      !filters && offset === 0
        ? setTimeout(() => {
            const correctedLimit = calculateTableLimit();

            if (correctedLimit !== useDatabaseStore.getState().limit) {
              fetchData(correctedLimit);
            }
          }, 50)
        : null;

    const handler = setTimeout(fetchData, filters ? 100 : 0);

    return () => {
      clearTimeout(handler);
      if (correctionHandler != null) {
        clearTimeout(correctionHandler);
      }
    };
  }, [currentTable, filters, sorters, offset, tableLimit]);
}
