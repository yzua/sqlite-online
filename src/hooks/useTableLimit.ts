import { useLayoutEffect, useState } from "react";
import { calculateTableLimit } from "@/lib/calculateTableLimit";

export const BROWSE_TABLE_LAYOUT_EVENT = "browse-table-layout";

/**
 * Measures the available DOM height and computes how many table rows
 * fit in the current viewport. Recalculates on mount and window resize.
 */
export function useTableLimit(currentTable: string | null) {
  const [tableLimit, setTableLimit] = useState(() => calculateTableLimit());

  useLayoutEffect(() => {
    if (!currentTable) {
      return;
    }

    const updateLimit = () => {
      const newLimit = calculateTableLimit();
      setTableLimit((prev) => (prev !== newLimit ? newLimit : prev));
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => {
            updateLimit();
          });

    const observedElements = [
      document.getElementById("dataSection"),
      document.getElementById("paginationControls"),
      document.getElementById("tableHeader")
    ].filter((element) => element != null);

    updateLimit();

    for (const element of observedElements) {
      resizeObserver?.observe(element);
    }

    window.addEventListener("resize", updateLimit);
    window.addEventListener(BROWSE_TABLE_LAYOUT_EVENT, updateLimit);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateLimit);
      window.removeEventListener(BROWSE_TABLE_LAYOUT_EVENT, updateLimit);
    };
  }, [currentTable]);

  return tableLimit;
}
