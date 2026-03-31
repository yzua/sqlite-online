import { debounce } from "lodash";
import { create } from "zustand";

interface PanelState {
  schemaPanelSize: number;
  dataPanelSize: number;
  editValues: string[];
}

interface PanelActions {
  setSchemaPanelSize: (size: number) => void;
  setDataPanelSize: (size: number) => void;
  setEditValues: (values: string[]) => void;
}

type PanelStore = PanelState & PanelActions;

const PANEL_SIZE_DEBOUNCE_MS = 200;

function createDebouncedPanelSizeSetter(
  key: "schemaPanelSize" | "dataPanelSize",
  set: (partial: Partial<PanelState>) => void
) {
  return debounce(
    (size: number) => set({ [key]: size }),
    PANEL_SIZE_DEBOUNCE_MS
  );
}

export const usePanelStore = create<PanelStore>((set) => {
  const debouncedSetSchemaPanelSize = createDebouncedPanelSizeSetter(
    "schemaPanelSize",
    set
  );

  const debouncedSetDataPanelSize = createDebouncedPanelSizeSetter(
    "dataPanelSize",
    set
  );

  return {
    // --- State ---
    schemaPanelSize: 25,
    dataPanelSize: 75,
    editValues: [],

    // --- Actions ---
    setSchemaPanelSize: debouncedSetSchemaPanelSize,
    setDataPanelSize: debouncedSetDataPanelSize,
    setEditValues: (values) => set({ editValues: values })
  };
});

export const selectPanelSizes = (state: PanelState) => ({
  schemaPanelSize: state.schemaPanelSize,
  dataPanelSize: state.dataPanelSize
});

export const selectEditValues = (state: PanelState) => state.editValues;
