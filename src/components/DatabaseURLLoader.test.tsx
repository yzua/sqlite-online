import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import showToast from "@/components/common/Toaster/Toast";
import useDatabaseWorker from "@/hooks/useWorker";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import DatabaseURLLoader from "./DatabaseURLLoader";

vi.mock("@/components/common/Toaster/Toast", () => ({
  default: vi.fn()
}));

vi.mock("@/hooks/useWorker", () => ({
  default: vi.fn()
}));

const setIsDatabaseLoading = vi.fn();

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: vi.fn()
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DialogFooter: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  )
}));

describe("DatabaseURLLoader", () => {
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
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector({ setIsDatabaseLoading } as never)
    );
    handleFileUpload.mockReset();
    setIsDatabaseLoading.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    window.history.replaceState({}, "", "/");
  });

  it("loads a database file from the url query parameter", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      blob: async () =>
        new Blob([new Uint8Array(256)], { type: "application/octet-stream" })
    } as Response);
    window.history.replaceState(
      {},
      "",
      "/?url=https%3A%2F%2Fexample.com%2Fdemo.sqlite"
    );

    render(<DatabaseURLLoader />);

    await waitFor(() => expect(handleFileUpload).toHaveBeenCalledTimes(1));

    expect(fetch).toHaveBeenCalledWith("https://example.com/demo.sqlite", {
      method: "GET"
    });
    expect(showToast).toHaveBeenCalledWith(
      "Database loaded successfully",
      "success"
    );
    expect(setIsDatabaseLoading).toHaveBeenLastCalledWith(false);
  });

  it("shows the proxy retry dialog after a direct fetch failure", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob([new Uint8Array(256)])
      } as Response);
    window.history.replaceState(
      {},
      "",
      "/?url=https%3A%2F%2Fexample.com%2Fdemo.sqlite"
    );

    render(<DatabaseURLLoader />);

    expect(
      await screen.findByRole("heading", { name: /cors error detected/i })
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /use cors proxy/i }));

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenLastCalledWith(
      "https://corsproxy.io/?url=https%3A%2F%2Fexample.com%2Fdemo.sqlite",
      { method: "GET" }
    );
  });

  it("rejects invalid url parameters without fetching", async () => {
    window.history.replaceState({}, "", "/?url=not-a-valid-url");

    render(<DatabaseURLLoader />);

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Invalid URL format", "error")
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(handleFileUpload).not.toHaveBeenCalled();
  });
});
