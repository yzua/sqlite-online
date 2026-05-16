import { useCallback, useMemo, useState } from "react";
import type { SqlValue } from "sql.js";
import useKeyPress from "@/hooks/useKeyPress";

import {
  EditValuesContext,
  PanelActionsContext,
  PanelStateContext
} from "./PanelContext";
import type { SelectedRowObject } from "./types";

interface PanelProviderProps {
  children: React.ReactNode;
}

const PanelProvider = ({ children }: PanelProviderProps) => {
  const [selectedRowObject, setSelectedRowObject] =
    useState<SelectedRowObject | null>(null);
  const [isInserting, setIsInserting] = useState(false);
  const [editValues, setEditValues] = useState<string[]>([]);

  const isEditing = selectedRowObject !== null || isInserting;

  const handleRowClick = useCallback(
    (row: SqlValue[], index: number, primaryValue: SqlValue | null) => {
      setIsInserting(false);
      setSelectedRowObject({ data: row, index, primaryValue });
    },
    []
  );

  const handleInsert = useCallback(() => {
    setSelectedRowObject(null);
    setIsInserting(true);
  }, []);

  const handleCloseEdit = useCallback(() => {
    setIsInserting(false);
    setSelectedRowObject(null);
  }, []);

  useKeyPress("ctrl+i", handleInsert, true);
  useKeyPress("ctrl+`", handleCloseEdit, true);

  // Actions never change — all callbacks are stable via useCallback([]) or
  // useState setters.
  const actionsValue = useMemo(
    () => ({
      handleRowClick,
      handleInsert,
      handleCloseEdit,
      setSelectedRowObject,
      setIsInserting,
      setEditValues
    }),
    [handleRowClick, handleInsert, handleCloseEdit]
  );

  const stateValue = useMemo(
    () => ({ isEditing, isInserting, selectedRowObject }),
    [isEditing, isInserting, selectedRowObject]
  );

  const editValuesValue = useMemo(() => ({ editValues }), [editValues]);

  return (
    <PanelActionsContext.Provider value={actionsValue}>
      <PanelStateContext.Provider value={stateValue}>
        <EditValuesContext.Provider value={editValuesValue}>
          {children}
        </EditValuesContext.Provider>
      </PanelStateContext.Provider>
    </PanelActionsContext.Provider>
  );
};

export default PanelProvider;
