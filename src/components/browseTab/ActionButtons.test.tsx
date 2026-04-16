import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ActionButtons from "./ActionButtons";
import { useBrowseActions } from "./useBrowseActions";

vi.mock("./useBrowseActions", () => ({
  useBrowseActions: vi.fn()
}));

vi.mock("./ActionsDropdown", () => ({
  default: () => <div>Actions Dropdown</div>
}));

describe("ActionButtons", () => {
  const handleClearFilters = vi.fn();
  const handleResetSorters = vi.fn();
  const handleExport = vi.fn();

  beforeEach(() => {
    vi.mocked(useBrowseActions).mockReturnValue({
      handleClearFilters,
      handleResetSorters,
      handleExport
    });
    handleClearFilters.mockReset();
    handleResetSorters.mockReset();
    handleExport.mockReset();
  });

  it("clears filters and reset sorters for browse workflows", () => {
    render(<ActionButtons filters={{ name: "Ada" }} sorters={{ id: "asc" }} />);

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
    render(<ActionButtons filters={null} sorters={null} />);

    fireEvent.click(
      screen.getByRole("button", { name: /export entire table as csv file/i })
    );

    expect(handleExport).toHaveBeenCalledWith("table");
  });
});
