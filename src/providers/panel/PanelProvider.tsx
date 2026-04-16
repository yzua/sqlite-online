import { useCallback, useMemo, useState } from "react";
import type { SqlValue } from "sql.js";
import useKeyPress from "@/hooks/useKeyPress";

import PanelContext from "./PanelContext";
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

  // Handle row click to toggle edit panel
  const handleRowClick = useCallback(
    (row: SqlValue[], index: number, primaryValue: SqlValue | null) => {
      setIsInserting(false);
      setSelectedRowObject({ data: row, index, primaryValue });
    },
    []
  );

  // Handle insert row button click
  const handleInsert = useCallback(() => {
    setSelectedRowObject(null);
    setIsInserting(true);
  }, []);

  // Handle closing edit panel
  const handleCloseEdit = useCallback(() => {
    setIsInserting(false);
    setSelectedRowObject(null);
  }, []);

  // Register hotkeys
  useKeyPress("ctrl+i", handleInsert, true);
  useKeyPress("ctrl+`", handleCloseEdit, true);

  const value = useMemo(
    () => ({
      handleRowClick,
      handleInsert,
      handleCloseEdit,
      isEditing,
      selectedRowObject,
      isInserting,
      setIsInserting,
      setSelectedRowObject,
      editValues,
      setEditValues
    }),
    [
      handleRowClick,
      handleInsert,
      handleCloseEdit,
      isEditing,
      selectedRowObject,
      isInserting,
      editValues
    ]
  );

  return (
    <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
  );
};

export default PanelProvider;
