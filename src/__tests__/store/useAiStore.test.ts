import { beforeEach, describe, expect, it, vi } from "vitest";
import SecureStorage from "@/lib/storage/secureStorage";
import { useAiStore } from "@/store/useAiStore";

vi.mock("@/lib/storage/secureStorage", () => ({
  default: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn()
  }
}));

const secureStorage = vi.mocked(SecureStorage);

describe("useAiStore", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    useAiStore.setState({
      geminiApiKey: null,
      isAiLoading: false
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("persists API keys securely and removes them when cleared", async () => {
    await useAiStore.getState().setGeminiApiKey("secret-key");
    await useAiStore.getState().setGeminiApiKey(null);

    expect(secureStorage.setItem).toHaveBeenCalledWith(
      "geminiApiKey",
      "secret-key"
    );
    expect(secureStorage.removeItem).toHaveBeenCalledWith("geminiApiKey");
  });

  it("falls back to localStorage when secure persistence fails", async () => {
    secureStorage.setItem.mockRejectedValueOnce(new Error("boom"));

    await useAiStore.getState().setGeminiApiKey("fallback-key");

    expect(localStorage.getItem("geminiApiKey")).toBe("fallback-key");
  });

  it("loads and migrates legacy API keys during initialization", async () => {
    secureStorage.getItem.mockResolvedValueOnce(null);
    secureStorage.setItem.mockResolvedValueOnce();
    localStorage.setItem("geminiApiKey", "legacy-key");

    await useAiStore.getState().initializeApiKey();

    expect(secureStorage.setItem).toHaveBeenCalledWith(
      "geminiApiKey",
      "legacy-key"
    );
    expect(localStorage.getItem("geminiApiKey")).toBeNull();
    expect(useAiStore.getState().geminiApiKey).toBe("legacy-key");
  });
});
