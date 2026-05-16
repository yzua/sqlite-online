import { useContext } from "react";

import {
  EditValuesContext,
  PanelActionsContext,
  PanelStateContext
} from "@/providers/panel/PanelContext";

function usePanelActions() {
  const context = useContext(PanelActionsContext);
  if (context === undefined) {
    throw new Error("usePanelActions must be used within a PanelProvider");
  }
  return context;
}

function usePanelState() {
  const context = useContext(PanelStateContext);
  if (context === undefined) {
    throw new Error("usePanelState must be used within a PanelProvider");
  }
  return context;
}

const usePanelManager = () => {
  return { ...usePanelActions(), ...usePanelState() };
};

const useEditValues = () => {
  const context = useContext(EditValuesContext);
  if (context === undefined) {
    throw new Error("useEditValues must be used within a PanelProvider");
  }
  return context;
};

export default usePanelManager;
export { useEditValues, usePanelActions, usePanelState };
