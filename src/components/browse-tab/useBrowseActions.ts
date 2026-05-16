import { useCallback, useMemo } from "react";
import { usePanelActions } from "@/hooks/usePanel";
import useDatabaseWorker from "@/hooks/useWorker";
import { useDatabaseStore } from "@/store/useDatabaseStore";

export function useBrowseActions() {
  const setFilters = useDatabaseStore((state) => state.setFilters);
  const setSorters = useDatabaseStore((state) => state.setSorters);
  const { handleExport } = useDatabaseWorker();
  const { setSelectedRowObject } = usePanelActions();

  const handleClearFilters = useCallback(() => {
    setFilters(null);
    setSelectedRowObject(null);
  }, [setFilters, setSelectedRowObject]);

  const handleResetSorters = useCallback(() => {
    setSorters(null);
    setSelectedRowObject(null);
  }, [setSorters, setSelectedRowObject]);

  return useMemo(
    () => ({ handleClearFilters, handleResetSorters, handleExport }),
    [handleClearFilters, handleResetSorters, handleExport]
  );
}
