import { createContext } from "react";

import type { SqlValue } from "sql.js";
import type { SelectedRowObject } from "./types";

interface PanelContextProps {
  handleRowClick: (
    row: SqlValue[],
    index: number,
    primaryValue: SqlValue | null
  ) => void;
  handleInsert: () => void;
  isEditing: boolean;
  selectedRowObject: SelectedRowObject | null;
  isInserting: boolean;
  setIsInserting: (value: boolean) => void;
  setSelectedRowObject: (value: SelectedRowObject | null) => void;
  handleCloseEdit: () => void;
  setEditValues: (values: string[]) => void;
}

interface EditValuesContextProps {
  editValues: string[];
}

const PanelContext = createContext<PanelContextProps | undefined>(undefined);
const EditValuesContext = createContext<EditValuesContextProps | undefined>(
  undefined
);

export default PanelContext;
export { EditValuesContext };
