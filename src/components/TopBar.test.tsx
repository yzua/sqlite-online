import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import useDatabaseWorker from "@/hooks/useWorker";
import TopBar from "./TopBar";

vi.mock("@/hooks/useWorker", () => ({
  default: vi.fn()
}));

vi.mock("@/components/accessibility/HighContrastToggle", () => ({
  default: () => <button type="button">High contrast</button>
}));

vi.mock("@/components/theme/ModeToggle", () => ({
  default: () => <button type="button">Mode toggle</button>
}));

describe("TopBar", () => {
  const handleFileChange = vi.fn();
  const handleDownload = vi.fn();

  beforeEach(() => {
    vi.mocked(useDatabaseWorker).mockReturnValue({
      handleFileUpload: vi.fn(),
      handleFileChange,
      handleDownload,
      handleTableChange: vi.fn(),
      handleQueryFilter: vi.fn(),
      handleQuerySorter: vi.fn(),
      handlePageChange: vi.fn(),
      handleExport: vi.fn(),
      handleQueryExecute: vi.fn(),
      handleEditSubmit: vi.fn()
    });
    handleFileChange.mockReset();
    handleDownload.mockReset();
  });

  it("wires file upload and save actions to the worker API", () => {
    render(<TopBar />);

    const fileInput = screen.getByLabelText(
      /select a sqlite database file to open/i
    );
    const file = new File(["db"], "sample.sqlite", {
      type: "application/octet-stream"
    });

    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.click(
      screen.getByRole("button", { name: /save current database/i })
    );

    expect(fileInput).toHaveAttribute("accept", ".db,.sqlite,.sqlite3");
    expect(handleFileChange).toHaveBeenCalledTimes(1);
    expect(handleDownload).toHaveBeenCalledTimes(1);
  });

  it("renders the external GitHub link and settings controls", () => {
    render(<TopBar />);

    expect(
      screen.getByRole("link", { name: /view source code on github/i })
    ).toHaveAttribute("href", "https://github.com/yzua/sqlite-online");
    expect(screen.getByRole("button", { name: "High contrast" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Mode toggle" })).toBeVisible();
  });
});
