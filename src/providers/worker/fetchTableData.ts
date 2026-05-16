import { calculateTableLimit } from "@/lib/calculateTableLimit";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import type { Filters, Sorters } from "@/types";
import { postWorkerMessage } from "./postWorkerMessage";

export interface FetchTableDataParams {
  worker: Worker;
  currentTable: string;
  filters: Filters;
  sorters: Sorters;
  offset: number;
  tableLimit: number;
  /** Debounce delay in ms. 0 for immediate, >0 for filter keystrokes. */
  debounceMs: number;
}

export interface FetchTableDataResult {
  /** Timers to clear on cleanup. */
  timers: ReturnType<typeof setTimeout>[];
}

/**
 * Posts a getTableData message to the worker after an optional debounce.
 * Updates Zustand's `limit` and `isDataLoading` in a single setState.
 *
 * Returns timers that the caller must clear on effect cleanup.
 */
export function fetchTableData(
  params: FetchTableDataParams
): FetchTableDataResult {
  const {
    worker,
    currentTable,
    filters,
    sorters,
    offset,
    tableLimit,
    debounceMs
  } = params;

  const timers: ReturnType<typeof setTimeout>[] = [];

  const fetchData = (limitOverride?: number) => {
    const nextLimit = limitOverride ?? tableLimit;
    const currentLimit = useDatabaseStore.getState().limit;
    useDatabaseStore.setState({
      ...(nextLimit !== currentLimit ? { limit: nextLimit } : {}),
      isDataLoading: true
    });

    postWorkerMessage(worker, {
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

  // One-shot limit correction: the first DOM measurement can happen
  // before the browse panel reaches its final height.
  if (!filters && offset === 0) {
    timers.push(
      setTimeout(() => {
        const correctedLimit = calculateTableLimit();
        if (correctedLimit !== useDatabaseStore.getState().limit) {
          fetchData(correctedLimit);
        }
      }, 50)
    );
  }

  timers.push(setTimeout(() => fetchData(), debounceMs));

  return { timers };
}
