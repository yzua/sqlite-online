import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestGeminiSql } from "@/lib/gemini";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { useGeminiAI } from "./useGeminiAI";

vi.mock("@/lib/gemini", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/gemini")>("@/lib/gemini");
  return {
    ...actual,
    requestGeminiSql: vi.fn()
  };
});

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: vi.fn()
}));

const state = {
  geminiApiKey: null as string | null,
  tablesSchema: {},
  customQuery: "",
  isAiLoading: false,
  setCustomQuery: vi.fn(),
  setErrorMessage: vi.fn(),
  setIsAiLoading: vi.fn()
};

describe("useGeminiAI", () => {
  beforeEach(() => {
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector(state as never)
    );
    Object.assign(state, {
      geminiApiKey: null,
      tablesSchema: {},
      customQuery: "",
      isAiLoading: false
    });
    state.setCustomQuery.mockReset();
    state.setErrorMessage.mockReset();
    state.setIsAiLoading.mockReset();
    vi.mocked(requestGeminiSql).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("sets an error when the api key is missing", async () => {
    const { result } = renderHook(() => useGeminiAI());

    await result.current.generateSqlQuery();

    expect(state.setErrorMessage).toHaveBeenCalledWith(
      "Gemini API key not set."
    );
  });

  it("does nothing for non-ai prompts", async () => {
    state.geminiApiKey = "key";
    state.customQuery = "SELECT 1";
    const { result } = renderHook(() => useGeminiAI());

    await result.current.generateSqlQuery();

    expect(requestGeminiSql).not.toHaveBeenCalled();
    expect(state.setIsAiLoading).not.toHaveBeenCalled();
  });

  it("requests sql and updates query state for ai prompts", async () => {
    state.geminiApiKey = "key";
    state.customQuery = "/ai list users";
    vi.mocked(requestGeminiSql).mockResolvedValue("SELECT * FROM users");
    const { result } = renderHook(() => useGeminiAI());

    await result.current.generateSqlQuery();

    expect(state.setIsAiLoading).toHaveBeenNthCalledWith(1, true);
    expect(state.setErrorMessage).toHaveBeenCalledWith(null);
    expect(requestGeminiSql).toHaveBeenCalledWith("key", "/ai list users", {});
    expect(state.setCustomQuery).toHaveBeenCalledWith("SELECT * FROM users");
    expect(state.setIsAiLoading).toHaveBeenLastCalledWith(false);
  });

  it("stores a generic error when the request fails", async () => {
    state.geminiApiKey = "key";
    state.customQuery = "/ai list users";
    vi.mocked(requestGeminiSql).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useGeminiAI());

    await result.current.generateSqlQuery();

    expect(state.setErrorMessage).toHaveBeenCalledWith(
      "Error calling Gemini API."
    );
    expect(state.setIsAiLoading).toHaveBeenLastCalledWith(false);
  });
});
