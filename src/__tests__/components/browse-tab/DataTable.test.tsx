import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DataTable from "@/components/browse-tab/DataTable";
import usePanelManager from "@/hooks/usePanel";
import useDatabaseWorker from "@/hooks/useWorker";

vi.mock("zustand/react/shallow", () => ({
  useShallow: (selector: unknown) => selector
}));

vi.mock("@/hooks/usePanel", () => ({
  default: vi.fn()
}));

vi.mock("@/hooks/useWorker", () => ({
  default: vi.fn()
}));

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: vi.fn(),
  selectBrowseTableState: (state: unknown) => state
}));

vi.mock("@/components/table/SorterButton", () => ({
  default: () => <button type="button">Sort column</button>
}));

vi.mock("@/components/table/ColumnIcon", () => ({
  default: () => <span>icon</span>
}));

vi.mock("@/components/table/FilterInput", () => ({
  default: ({ column }: { column: string }) => (
    <input aria-label={`Filter ${column} column`} />
  )
}));

vi.mock("@/components/browse-tab/BrowseTableRow", () => ({
  default: ({ rowIndex }: { rowIndex: number }) => (
    <tr data-slot="table-row">
      <td>Row {rowIndex + 1}</td>
    </tr>
  )
}));

vi.mock("@/components/browse-tab/BrowseTableEmptyState", () => ({
  default: () => <div>No rows</div>
}));

vi.mock("@/components/browse-tab/useBrowseActions", () => ({
  useBrowseActions: vi.fn(() => ({
    handleClearFilters: vi.fn()
  }))
}));

const mockState = {
  data: [[1, "Emma"]],
  columns: ["id", "first_name"],
  currentTable: "customers",
  currentTableSchema: {
    schema: [{ name: "id" }, { name: "first_name" }]
  },
  filters: null,
  sorters: null
};

describe("DataTable", () => {
  beforeEach(async () => {
    const { useDatabaseStore } = await import("@/store/useDatabaseStore");

    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector(mockState as never)
    );

    vi.mocked(useDatabaseWorker).mockReturnValue({
      handleQueryFilter: vi.fn()
    } as never);

    vi.mocked(usePanelManager).mockReturnValue({
      handleRowClick: vi.fn(),
      selectedRowObject: null
    } as never);
  });

  it("stretches to fill the available data panel height", () => {
    render(<DataTable />);

    expect(screen.getByLabelText("Database table data")).toHaveClass(
      "flex-1",
      "min-h-0",
      "overflow-auto"
    );
    expect(document.querySelector('[data-slot="table-container"]')).toHaveClass(
      "h-full",
      "overflow-auto"
    );
  });
});
