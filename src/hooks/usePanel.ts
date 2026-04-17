import { useContext } from "react";

import PanelContext, {
  EditValuesContext
} from "@/providers/panel/PanelContext";

const usePanelManager = () => {
  const context = useContext(PanelContext);

  if (context === undefined) {
    throw new Error("usePanelManager must be used within a PanelProvider");
  }

  return context;
};

const useEditValues = () => {
  const context = useContext(EditValuesContext);

  if (context === undefined) {
    throw new Error("useEditValues must be used within a PanelProvider");
  }

  return context;
};

export default usePanelManager;
export { useEditValues };
