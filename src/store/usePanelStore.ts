import { create } from "zustand";

import { debounce } from "lodash";

interface PanelState {
  schemaPanelSize: number;
  dataPanelSize: number;
  editValues: string[];
  isInserting: boolean;
}

interface PanelActions {
  setSchemaPanelSize: (size: number) => void;
  setDataPanelSize: (size: number) => void;
  setEditValues: (values: string[]) => void;
  setIsInserting: (inserting: boolean) => void;
}

type PanelStore = PanelState & PanelActions;

export const usePanelStore = create<PanelStore>((set) => {
  const debouncedSetSchemaPanelSize = debounce(
    (size: number) => set({ schemaPanelSize: size }),
    200
  );

  const debouncedSetDataPanelSize = debounce(
    (size: number) => set({ dataPanelSize: size }),
    200
  );

  return {
    // --- State ---
    schemaPanelSize: 25,
    dataPanelSize: 75,
    editValues: [],
    isInserting: false,

    // --- Actions ---
    setSchemaPanelSize: debouncedSetSchemaPanelSize,
    setDataPanelSize: debouncedSetDataPanelSize,
    setEditValues: (values) => set({ editValues: values }),
    setIsInserting: (inserting) => set({ isInserting: inserting })
  };
});
