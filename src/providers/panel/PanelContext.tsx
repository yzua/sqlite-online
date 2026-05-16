import { createContext } from "react";

import type { SqlValue } from "sql.js";
import type { SelectedRowObject } from "./types";

// Split into actions (stable references) and state (changes on interaction).
// This prevents components that only need callbacks (e.g. WorkerProvider)
// from re-rendering when selection or edit state changes.

interface PanelActionsContextProps {
  handleRowClick: (
    row: SqlValue[],
    index: number,
    primaryValue: SqlValue | null
  ) => void;
  handleInsert: () => void;
  handleCloseEdit: () => void;
  setSelectedRowObject: (value: SelectedRowObject | null) => void;
  setIsInserting: (value: boolean) => void;
  setEditValues: (values: string[]) => void;
}

interface PanelStateContextProps {
  isEditing: boolean;
  isInserting: boolean;
  selectedRowObject: SelectedRowObject | null;
}

interface EditValuesContextProps {
  editValues: string[];
}

const PanelActionsContext = createContext<PanelActionsContextProps | undefined>(
  undefined
);
const PanelStateContext = createContext<PanelStateContextProps | undefined>(
  undefined
);
const EditValuesContext = createContext<EditValuesContextProps | undefined>(
  undefined
);

export { EditValuesContext, PanelActionsContext, PanelStateContext };
