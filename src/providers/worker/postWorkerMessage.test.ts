import { describe, expect, it, vi } from "vitest";
import showToast from "@/lib/toast";
import { postWorkerMessage } from "./postWorkerMessage";

vi.mock("@/lib/toast", () => ({
  default: vi.fn()
}));

describe("postWorkerMessage", () => {
  it("posts messages when a worker exists", () => {
    const worker = { postMessage: vi.fn() } as unknown as Worker;

    expect(postWorkerMessage(worker, { action: "download" })).toBe(true);
    expect(worker.postMessage).toHaveBeenCalledWith({ action: "download" }, []);
  });

  it("shows an error and returns false when the worker is missing", () => {
    expect(postWorkerMessage(null, { action: "download" })).toBe(false);
    expect(showToast).toHaveBeenCalledWith(
      "Worker is not initialized",
      "error"
    );
  });
});
