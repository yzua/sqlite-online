import { useCallback } from "react";
import usePanelManager from "@/hooks/usePanel";
import useDatabaseWorker from "@/hooks/useWorker";
import { useDatabaseStore } from "@/store/useDatabaseStore";

export function useBrowseActions() {
  const setFilters = useDatabaseStore((state) => state.setFilters);
  const setSorters = useDatabaseStore((state) => state.setSorters);
  const { handleExport } = useDatabaseWorker();
  const { setSelectedRowObject } = usePanelManager();

  const handleClearFilters = useCallback(() => {
    setFilters(null);
    setSelectedRowObject(null);
  }, [setFilters, setSelectedRowObject]);

  const handleResetSorters = useCallback(() => {
    setSorters(null);
    setSelectedRowObject(null);
  }, [setSorters, setSelectedRowObject]);

  return {
    handleClearFilters,
    handleResetSorters,
    handleExport
  };
}
