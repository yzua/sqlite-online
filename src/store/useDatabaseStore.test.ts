import { beforeEach, describe, expect, it, vi } from "vitest";
import SecureStorage from "@/lib/secureStorage";
import {
  selectBrowseTableState,
  selectExecuteViewState,
  selectIsCurrentTableView,
  selectPaginationState,
  useDatabaseStore
} from "./useDatabaseStore";

vi.mock("@/lib/secureStorage", () => ({
  default: {
    getItem: vi.fn(),
    removeItem: vi.fn(),
    setItem: vi.fn()
  }
}));

const secureStorage = vi.mocked(SecureStorage);

describe("useDatabaseStore", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    useDatabaseStore.setState({
      tablesSchema: {},
      indexesSchema: [],
      currentTable: null,
      data: null,
      columns: null,
      maxSize: 1,
      isDatabaseLoading: false,
      isDataLoading: false,
      errorMessage: null,
      filters: null,
      sorters: null,
      limit: 50,
      offset: 0,
      customQuery: "",
      customQueryObject: null,
      geminiApiKey: null,
      isAiLoading: false
    });
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("persists API keys securely and removes them when cleared", async () => {
    await useDatabaseStore.getState().setGeminiApiKey("secret-key");
    await useDatabaseStore.getState().setGeminiApiKey(null);

    expect(secureStorage.setItem).toHaveBeenCalledWith(
      "geminiApiKey",
      "secret-key"
    );
    expect(secureStorage.removeItem).toHaveBeenCalledWith("geminiApiKey");
  });

  it("falls back to localStorage when secure persistence fails", async () => {
    secureStorage.setItem.mockRejectedValueOnce(new Error("boom"));

    await useDatabaseStore.getState().setGeminiApiKey("fallback-key");

    expect(localStorage.getItem("geminiApiKey")).toBe("fallback-key");
  });

  it("loads and migrates legacy API keys during initialization", async () => {
    secureStorage.getItem.mockResolvedValueOnce(null);
    secureStorage.setItem.mockResolvedValueOnce();
    localStorage.setItem("geminiApiKey", "legacy-key");

    await useDatabaseStore.getState().initializeApiKey();

    expect(secureStorage.setItem).toHaveBeenCalledWith(
      "geminiApiKey",
      "legacy-key"
    );
    expect(localStorage.getItem("geminiApiKey")).toBeNull();
    expect(useDatabaseStore.getState().geminiApiKey).toBe("legacy-key");
  });

  it("supports functional offset updates and exposes derived selectors", () => {
    useDatabaseStore.setState({
      currentTable: "users_view",
      tablesSchema: {
        users_view: {
          primaryKey: null,
          type: "view",
          schema: []
        }
      },
      data: [[1, "Ada"]],
      columns: ["id", "name"],
      maxSize: 120,
      isDataLoading: true,
      isDatabaseLoading: false,
      filters: { name: "Ada" },
      sorters: { id: "asc" },
      errorMessage: "query failed",
      customQuery: "SELECT * FROM users",
      customQueryObject: { columns: ["id"], data: [[1]] },
      limit: 25,
      offset: 25
    });

    useDatabaseStore
      .getState()
      .setOffset((currentOffset) => currentOffset + 25);

    const state = useDatabaseStore.getState();

    expect(state.offset).toBe(50);
    expect(selectIsCurrentTableView(state)).toBe(true);
    expect(selectBrowseTableState(state)).toMatchObject({
      currentTable: "users_view",
      columns: ["id", "name"],
      filters: { name: "Ada" }
    });
    expect(selectExecuteViewState(state)).toMatchObject({
      errorMessage: "query failed",
      customQuery: "SELECT * FROM users"
    });
    expect(selectPaginationState(state)).toEqual({
      offset: 50,
      limit: 25,
      maxSize: 120,
      isDataLoading: true
    });
  });
});
