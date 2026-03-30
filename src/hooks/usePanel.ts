import { useContext } from "react";

import PanelContext from "@/providers/panel/PanelContext";

const usePanelManager = () => {
  const context = useContext(PanelContext);

  if (context === undefined) {
    throw new Error("usePanelManager must be used within a PanelProvider");
  }

  return context;
};

export default usePanelManager;
