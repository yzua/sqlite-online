import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useFileDrop from "@/hooks/useFileDrop";
import FileDropHandler from "./FileDropHandler";

vi.mock("@/hooks/useFileDrop", () => ({
  default: vi.fn()
}));

describe("FileDropHandler", () => {
  it("renders children without the overlay when not dragging", () => {
    vi.mocked(useFileDrop).mockReturnValue({ isDragging: false });

    render(
      <FileDropHandler>
        <div>Child content</div>
      </FileDropHandler>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
    expect(screen.queryByText("Drop SQLite Database")).toBeNull();
  });

  it("shows the drop overlay when dragging files", () => {
    vi.mocked(useFileDrop).mockReturnValue({ isDragging: true });

    render(
      <FileDropHandler>
        <div>Child content</div>
      </FileDropHandler>
    );

    expect(screen.getByText("Drop SQLite Database")).toBeInTheDocument();
    expect(
      screen.getByText("Release to load your database file")
    ).toBeInTheDocument();
  });
});
