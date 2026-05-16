import { useEffect } from "react";
import { useTableLimit } from "@/hooks/useTableLimit";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { fetchTableData } from "./fetchTableData";

export function useTableDataFetch(workerRef: React.RefObject<Worker | null>) {
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const offset = useDatabaseStore((state) => state.offset);
  const tableLimit = useTableLimit(currentTable);

  // biome-ignore lint/correctness/useExhaustiveDependencies: workerRef is a stable ref.
  useEffect(() => {
    if (!currentTable || !workerRef.current) {
      return;
    }

    const { timers } = fetchTableData({
      worker: workerRef.current,
      currentTable,
      filters,
      sorters,
      offset,
      tableLimit,
      debounceMs: filters ? 100 : 0
    });

    return () => {
      for (const t of timers) clearTimeout(t);
    };
  }, [currentTable, filters, sorters, offset, tableLimit]);
}
