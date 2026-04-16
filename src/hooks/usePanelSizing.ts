import { useShallow } from "zustand/react/shallow";
import { selectPanelSizes, usePanelStore } from "@/store/usePanelStore";

export function usePanelSizing() {
  const { dataPanelSize, schemaPanelSize } = usePanelStore(
    useShallow(selectPanelSizes)
  );
  const setDataPanelSize = usePanelStore((state) => state.setDataPanelSize);
  const setSchemaPanelSize = usePanelStore((state) => state.setSchemaPanelSize);

  return {
    dataPanelSize,
    schemaPanelSize,
    setDataPanelSize,
    setSchemaPanelSize
  };
}
