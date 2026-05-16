import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import showToast from "@/components/common/toast";
import { useDatabaseFetch } from "@/hooks/useDatabaseFetch";
import { useDatabaseStore } from "@/store/useDatabaseStore";

vi.mock("@/components/common/toast", () => ({
  default: vi.fn()
}));

const setIsDatabaseLoading = vi.fn();

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: vi.fn()
}));

describe("useDatabaseFetch", () => {
  const handleFileUpload = vi.fn();

  beforeEach(() => {
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector({ setIsDatabaseLoading } as never)
    );
    handleFileUpload.mockReset();
    setIsDatabaseLoading.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    window.history.replaceState({}, "", "/");
  });

  it("loads a database from the url query parameter", async () => {
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

    renderHook(() => useDatabaseFetch(handleFileUpload));

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

  it("shows the proxy dialog after a direct fetch failure", async () => {
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

    const { result } = renderHook(() => useDatabaseFetch(handleFileUpload));

    await waitFor(() => expect(result.current.showProxyDialog).toBe(true));

    expect(result.current.fetchError).toBe("Network error");

    await act(() => result.current.handleRetryWithProxy());

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(fetch).toHaveBeenLastCalledWith(
      "https://corsproxy.io/?url=https%3A%2F%2Fexample.com%2Fdemo.sqlite",
      { method: "GET" }
    );
  });

  it("rejects invalid url parameters without fetching", async () => {
    window.history.replaceState({}, "", "/?url=not-a-valid-url");

    renderHook(() => useDatabaseFetch(handleFileUpload));

    await waitFor(() =>
      expect(showToast).toHaveBeenCalledWith("Invalid URL format", "error")
    );
    expect(fetch).not.toHaveBeenCalled();
    expect(handleFileUpload).not.toHaveBeenCalled();
  });

  it("dismissDialog clears error and closes dialog", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));
    window.history.replaceState(
      {},
      "",
      "/?url=https%3A%2F%2Fexample.com%2Fdemo.sqlite"
    );

    const { result } = renderHook(() => useDatabaseFetch(handleFileUpload));

    await waitFor(() => expect(result.current.showProxyDialog).toBe(true));

    act(() => result.current.dismissDialog());

    expect(result.current.showProxyDialog).toBe(false);
    expect(result.current.fetchError).toBeNull();
  });
});
