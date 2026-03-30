import { createContext } from "react";

import type { SqlValue } from "sql.js";

interface PanelContextProps {
  handleRowClick: (
    row: SqlValue[],
    index: number,
    primaryValue: SqlValue
  ) => void;
  handleInsert: () => void;
  isEditing: boolean;
  selectedRowObject: {
    data: SqlValue[];
    index: number;
    primaryValue: SqlValue;
  } | null;
  isInserting: boolean;
  setIsInserting: (value: boolean) => void;
  setSelectedRowObject: (
    value: { data: SqlValue[]; index: number; primaryValue: SqlValue } | null
  ) => void;
  handleCloseEdit: () => void;
}

const PanelContext = createContext<PanelContextProps | undefined>(undefined);

export default PanelContext;
