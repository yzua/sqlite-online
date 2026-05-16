import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGeminiAI } from "@/hooks/useGeminiAI";
import { requestGeminiSql } from "@/lib/ai/gemini";
import { useAiStore } from "@/store/useAiStore";
import { useDatabaseStore } from "@/store/useDatabaseStore";

vi.mock("@/lib/ai/gemini", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/ai/gemini")>("@/lib/ai/gemini");
  return {
    ...actual,
    requestGeminiSql: vi.fn()
  };
});

vi.mock("@/store/useAiStore", () => ({
  useAiStore: vi.fn()
}));

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: vi.fn()
}));

const aiState = {
  geminiApiKey: null as string | null,
  isAiLoading: false,
  setIsAiLoading: vi.fn()
};

const dbState = {
  tablesSchema: {},
  customQuery: "",
  setCustomQuery: vi.fn(),
  setErrorMessage: vi.fn()
};

describe("useGeminiAI", () => {
  beforeEach(() => {
    vi.mocked(useAiStore).mockImplementation((selector) =>
      selector(aiState as never)
    );
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector(dbState as never)
    );
    Object.assign(aiState, {
      geminiApiKey: null,
      isAiLoading: false
    });
    Object.assign(dbState, {
      tablesSchema: {},
      customQuery: ""
    });
    dbState.setCustomQuery.mockReset();
    dbState.setErrorMessage.mockReset();
    aiState.setIsAiLoading.mockReset();
    vi.mocked(requestGeminiSql).mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("sets an error when the api key is missing", async () => {
    const { result } = renderHook(() => useGeminiAI());

    await result.current.generateSqlQuery();

    expect(dbState.setErrorMessage).toHaveBeenCalledWith(
      "Gemini API key not set."
    );
  });

  it("does nothing for non-ai prompts", async () => {
    aiState.geminiApiKey = "key";
    dbState.customQuery = "SELECT 1";
    const { result } = renderHook(() => useGeminiAI());

    await result.current.generateSqlQuery();

    expect(requestGeminiSql).not.toHaveBeenCalled();
    expect(aiState.setIsAiLoading).not.toHaveBeenCalled();
  });

  it("requests sql and updates query state for ai prompts", async () => {
    aiState.geminiApiKey = "key";
    dbState.customQuery = "/ai list users";
    vi.mocked(requestGeminiSql).mockResolvedValue("SELECT * FROM users");
    const { result } = renderHook(() => useGeminiAI());

    await result.current.generateSqlQuery();

    expect(aiState.setIsAiLoading).toHaveBeenNthCalledWith(1, true);
    expect(dbState.setErrorMessage).toHaveBeenCalledWith(null);
    expect(requestGeminiSql).toHaveBeenCalledWith("key", "/ai list users", {});
    expect(dbState.setCustomQuery).toHaveBeenCalledWith("SELECT * FROM users");
    expect(aiState.setIsAiLoading).toHaveBeenLastCalledWith(false);
  });

  it("stores a generic error when the request fails", async () => {
    aiState.geminiApiKey = "key";
    dbState.customQuery = "/ai list users";
    vi.mocked(requestGeminiSql).mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() => useGeminiAI());

    await result.current.generateSqlQuery();

    expect(dbState.setErrorMessage).toHaveBeenCalledWith(
      "Error calling Gemini API."
    );
    expect(aiState.setIsAiLoading).toHaveBeenLastCalledWith(false);
  });
});
