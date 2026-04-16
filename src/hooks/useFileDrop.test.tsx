import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import showToast from "@/components/common/Toaster/Toast";
import useDatabaseWorker from "@/hooks/useWorker";
import useFileDrop from "./useFileDrop";

vi.mock("@/components/common/Toaster/Toast", () => ({
  default: vi.fn()
}));

vi.mock("@/hooks/useWorker", () => ({
  default: vi.fn()
}));

function TestComponent() {
  const { isDragging } = useFileDrop();
  return <div>{isDragging ? "dragging" : "idle"}</div>;
}

function createDragEvent(type: string, file?: File) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "dataTransfer", {
    value: {
      types: file ? ["Files"] : [],
      files: file ? [file] : []
    }
  });
  return event;
}

describe("useFileDrop", () => {
  const handleFileUpload = vi.fn();

  beforeEach(() => {
    vi.mocked(useDatabaseWorker).mockReturnValue({
      handleFileUpload,
      handleFileChange: vi.fn(),
      handleDownload: vi.fn(),
      handleTableChange: vi.fn(),
      handleQueryFilter: vi.fn(),
      handleQuerySorter: vi.fn(),
      handlePageChange: vi.fn(),
      handleExport: vi.fn(),
      handleQueryExecute: vi.fn(),
      handleEditSubmit: vi.fn()
    });
    handleFileUpload.mockReset();
  });

  it("shows dragging state only for file drags", () => {
    render(<TestComponent />);

    window.dispatchEvent(createDragEvent("dragover"));
    expect(screen.getByText("idle")).toBeInTheDocument();

    window.dispatchEvent(
      createDragEvent("dragover", new File(["db"], "app.db"))
    );

    return waitFor(() => {
      expect(screen.getByText("dragging")).toBeInTheDocument();
    });
  });

  it("uploads the first dropped file and clears drag state", () => {
    render(<TestComponent />);

    window.dispatchEvent(
      createDragEvent("dragover", new File(["db"], "app.db"))
    );
    const file = new File(["db"], "app.db");
    window.dispatchEvent(createDragEvent("drop", file));

    expect(handleFileUpload).toHaveBeenCalledWith(file);
    expect(screen.getByText("idle")).toBeInTheDocument();
  });

  it("shows an error toast when a file drop has no files", () => {
    render(<TestComponent />);

    const event = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: { types: ["Files"], files: [] }
    });

    window.dispatchEvent(event);

    expect(showToast).toHaveBeenCalledWith("No file detected", "error");
  });
});
