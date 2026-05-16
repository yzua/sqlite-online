import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  selectBrowseTableState,
  selectExecuteViewState,
  selectIsCurrentTableView,
  selectPaginationState,
  useDatabaseStore
} from "@/store/useDatabaseStore";

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
      customQueryObject: null
    });
    localStorage.clear();
    vi.clearAllMocks();
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
