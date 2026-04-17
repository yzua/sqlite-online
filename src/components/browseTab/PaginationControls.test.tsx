import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import usePanelManager from "@/hooks/usePanel";
import useDatabaseWorker from "@/hooks/useWorker";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import PaginationControls from "./PaginationControls";

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
  selectIsCurrentTableView: (state: { isView: boolean }) => state.isView,
  selectPaginationState: (state: {
    offset: number;
    limit: number;
    maxSize: number;
    isDataLoading: boolean;
  }) => ({
    offset: state.offset,
    limit: state.limit,
    maxSize: state.maxSize,
    isDataLoading: state.isDataLoading
  })
}));

const storeState = {
  offset: 25,
  limit: 25,
  maxSize: 90,
  isDataLoading: false,
  isView: false
};

describe("PaginationControls", () => {
  const handlePageChange = vi.fn();
  const handleExport = vi.fn();
  const handleInsert = vi.fn();

  beforeEach(() => {
    storeState.isView = false;
    vi.mocked(useDatabaseWorker).mockReturnValue({
      handleFileUpload: vi.fn(),
      handleFileChange: vi.fn(),
      handleDownload: vi.fn(),
      handleTableChange: vi.fn(),
      handleQueryFilter: vi.fn(),
      handleQuerySorter: vi.fn(),
      handlePageChange,
      handleExport,
      handleQueryExecute: vi.fn(),
      handleEditSubmit: vi.fn()
    });
    vi.mocked(usePanelManager).mockReturnValue({
      isInserting: false,
      handleInsert,
      handleCloseEdit: vi.fn(),
      handleRowClick: vi.fn(),
      isEditing: false,
      selectedRowObject: null,
      setSelectedRowObject: vi.fn(),
      setIsInserting: vi.fn(),
      setEditValues: vi.fn()
    });
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector(storeState as never)
    );
    handlePageChange.mockReset();
    handleExport.mockReset();
    handleInsert.mockReset();
  });

  it("renders the visible row range and pagination controls", () => {
    render(<PaginationControls />);

    expect(
      screen.getByText(/showing rows 26 to 50 of 90/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /go to next page/i }));
    expect(handlePageChange).toHaveBeenCalledWith("next");
  });

  it("wires insert and export actions", () => {
    render(<PaginationControls />);

    fireEvent.click(
      screen.getByRole("button", { name: /insert new row into table/i })
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /export current table data as csv file/i
      })
    );

    expect(handleInsert).toHaveBeenCalledTimes(1);
    expect(handleExport).toHaveBeenCalledWith("current");
  });

  it("disables insert for database views", () => {
    storeState.isView = true;

    render(<PaginationControls />);

    expect(
      screen.getByRole("button", { name: /cannot insert rows in views/i })
    ).toBeDisabled();
  });
});
