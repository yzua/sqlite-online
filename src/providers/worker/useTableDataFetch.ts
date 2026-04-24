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
 * Includes a one-shot limit correction after initial render when no filters
 * are active.
 */
export function useTableDataFetch(workerRef: React.RefObject<Worker | null>) {
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const offset = useDatabaseStore((state) => state.offset);
  const setLimit = useDatabaseStore((state) => state.setLimit);

  // Dynamic row limit based on viewport height
  const tableLimit = useTableLimit(currentTable);

  // biome-ignore lint/correctness/useExhaustiveDependencies: workerRef is a stable ref — including workerRef.current would cause the effect to fire on every render.
  useEffect(() => {
    if (!currentTable) {
      return;
    }

    void tableLimit;

    const fetchData = (limitOverride?: number) => {
      if (!workerRef.current) {
        showToast("Worker is not initialized", "error");
        return;
      }

      const nextLimit = limitOverride ?? calculateTableLimit();

      useDatabaseStore.getState().setIsDataLoading(true);

      setLimit(nextLimit);

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

    // After initial render, correct the row limit if the viewport-based
    // calculation differs from the stored value. Only runs when there are
    // no active filters and we're on the first page.
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
  }, [currentTable, filters, sorters, offset, tableLimit, setLimit]);
}
