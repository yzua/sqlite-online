import { useCallback, useState, useMemo } from "react";
import useKeyPress from "@/hooks/useKeyPress";

import type { SqlValue } from "sql.js";

import PanelContext from "./PanelContext";

interface PanelProviderProps {
  children: React.ReactNode;
}

const PanelProvider = ({ children }: PanelProviderProps) => {
  const [selectedRowObject, setSelectedRowObject] = useState<{
    data: SqlValue[];
    index: number;
    primaryValue: SqlValue;
  } | null>(null);
  const [isInserting, setIsInserting] = useState(false);

  const isEditing = selectedRowObject !== null || isInserting;

  // Handle row click to toggle edit panel
  const handleRowClick = useCallback(
    (row: SqlValue[], index: number, primaryValue: SqlValue) => {
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
      setSelectedRowObject
    }),
    [
      handleRowClick,
      handleInsert,
      handleCloseEdit,
      isEditing,
      selectedRowObject,
      isInserting,
      setIsInserting,
      setSelectedRowObject
    ]
  );

  return (
    <PanelContext.Provider value={value}>{children}</PanelContext.Provider>
  );
};

export default PanelProvider;
