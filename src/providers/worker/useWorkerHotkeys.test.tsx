import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import useKeyPress from "@/hooks/useKeyPress";
import { useWorkerHotkeys } from "./useWorkerHotkeys";

vi.mock("@/hooks/useKeyPress", () => ({
  default: vi.fn()
}));

describe("useWorkerHotkeys", () => {
  it("registers the keyboard shortcuts documented in the README", () => {
    renderHook(() =>
      useWorkerHotkeys({
        handleDownload: vi.fn(),
        handleEditSubmit: vi.fn(),
        handleQueryExecute: vi.fn(),
        handlePageChange: vi.fn()
      })
    );

    expect(useKeyPress).toHaveBeenCalledWith("ctrl+s", expect.any(Function));
    expect(useKeyPress).toHaveBeenCalledWith(
      "ctrl+I",
      expect.any(Function),
      true
    );
    expect(useKeyPress).toHaveBeenCalledWith("ctrl+u", expect.any(Function));
    expect(useKeyPress).toHaveBeenCalledWith("ctrl+d", expect.any(Function));
    expect(useKeyPress).toHaveBeenCalledWith("ctrl+q", expect.any(Function));
    expect(useKeyPress).toHaveBeenCalledWith(
      "ctrl+ArrowRight",
      expect.any(Function)
    );
    expect(useKeyPress).toHaveBeenCalledWith(
      "ctrl+ArrowUp",
      expect.any(Function)
    );
    expect(useKeyPress).toHaveBeenCalledWith(
      "ctrl+ArrowDown",
      expect.any(Function)
    );
    expect(useKeyPress).toHaveBeenCalledWith(
      "ctrl+ArrowLeft",
      expect.any(Function)
    );
  });
});
