import { create } from "zustand";

interface SchemaState {
  expandedTables: Set<string>;
  expandedIndexSection: boolean;
}

interface SchemaActions {
  toggleTable: (tableName: string) => void;
  setExpandedTables: (tables: string[]) => void;
  toggleExpandedIndexSection: () => void;
}

type SchemaStore = SchemaState & SchemaActions;

export const useSchemaStore = create<SchemaStore>((set) => ({
  // --- State ---
  expandedTables: new Set<string>(),
  expandedIndexSection: true,

  // --- Actions ---
  toggleTable: (tableName) =>
    set((state) => {
      const next = new Set(state.expandedTables);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return { expandedTables: next };
    }),

  setExpandedTables: (tables) =>
    set(() => ({
      expandedTables: new Set(tables)
    })),

  toggleExpandedIndexSection: () =>
    set((state) => ({
      expandedIndexSection: !state.expandedIndexSection
    }))
}));
