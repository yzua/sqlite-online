import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ActionButtons from "@/components/browse-tab/ActionButtons";
import { useBrowseActions } from "@/components/browse-tab/useBrowseActions";
import { useDatabaseStore } from "@/store/useDatabaseStore";

vi.mock("@/components/browse-tab/useBrowseActions", () => ({
  useBrowseActions: vi.fn()
}));

vi.mock("@/components/browse-tab/ActionsDropdown", () => ({
  default: () => <div>Actions Dropdown</div>
}));

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: vi.fn()
}));

describe("ActionButtons", () => {
  const handleClearFilters = vi.fn();
  const handleResetSorters = vi.fn();
  const handleExport = vi.fn();

  const state = {
    filters: { name: "Ada" } as Record<string, string> | null,
    sorters: { id: "asc" } as Record<string, string> | null
  };

  beforeEach(() => {
    vi.mocked(useBrowseActions).mockReturnValue({
      handleClearFilters,
      handleResetSorters,
      handleExport
    });
    handleClearFilters.mockReset();
    handleResetSorters.mockReset();
    handleExport.mockReset();
    Object.assign(state, { filters: { name: "Ada" }, sorters: { id: "asc" } });
  });

  it("clears filters and reset sorters for browse workflows", () => {
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector(state as never)
    );

    render(<ActionButtons />);

    fireEvent.click(
      screen.getByRole("button", { name: /clear 1 active filter/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /reset 1 active sort/i })
    );

    expect(handleClearFilters).toHaveBeenCalled();
    expect(handleResetSorters).toHaveBeenCalled();
  });

  it("exports the entire table as csv", () => {
    Object.assign(state, { filters: null, sorters: null });
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector(state as never)
    );

    render(<ActionButtons />);

    fireEvent.click(
      screen.getByRole("button", { name: /export entire table as csv file/i })
    );

    expect(handleExport).toHaveBeenCalledWith("table");
  });
});
