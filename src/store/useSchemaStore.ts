import { create } from "zustand";

interface SchemaState {
  expandedTables: string[];
  expandedIndexSection: boolean;
}

interface SchemaActions {
  toggleTable: (tableName: string) => void;
  setExpandedTables: (tables: string[]) => void;
  toggleExpandedIndexSection: () => void;
  setExpandedIndexSection: (value: boolean) => void;
}

type SchemaStore = SchemaState & SchemaActions;

export const useSchemaStore = create<SchemaStore>((set) => ({
  // --- State ---
  expandedTables: [],
  expandedIndexSection: true,

  // --- Actions ---
  toggleTable: (tableName) =>
    set((state) => {
      const isExpanded = state.expandedTables.includes(tableName);
      return {
        expandedTables: isExpanded
          ? state.expandedTables.filter((name) => name !== tableName)
          : [...state.expandedTables, tableName]
      };
    }),

  setExpandedTables: (tables) =>
    set(() => ({
      expandedTables: tables
    })),

  toggleExpandedIndexSection: () =>
    set((state) => ({
      expandedIndexSection: !state.expandedIndexSection
    })),

  setExpandedIndexSection: (value) =>
    set(() => ({
      expandedIndexSection: value
    }))
}));
