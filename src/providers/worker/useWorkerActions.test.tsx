import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import showToast from "@/components/common/Toaster/Toast";
import usePanelManager from "@/hooks/usePanel";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { parseSqlStatements } from "./parseSqlStatements";
import { postWorkerMessage } from "./postWorkerMessage";
import { useWorkerActions } from "./useWorkerActions";

vi.mock("@/components/common/Toaster/Toast", () => ({
  default: vi.fn()
}));

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: { getState: vi.fn() }
}));

vi.mock("@/hooks/usePanel", () => ({
  default: vi.fn()
}));

vi.mock("./parseSqlStatements", () => ({
  parseSqlStatements: vi.fn()
}));

vi.mock("./postWorkerMessage", () => ({
  postWorkerMessage: vi.fn()
}));

function createMockStore(overrides = {}) {
  return {
    currentTable: "users",
    tablesSchema: {
      users: {
        primaryKey: "id",
        type: "table" as const,
        schema: [
          {
            name: "id",
            cid: 0,
            type: "INTEGER",
            dflt_value: "",
            isNullable: false,
            isPrimaryKey: true,
            isForeignKey: false
          }
        ]
      }
    },
    filters: null,
    sorters: null,
    limit: 25,
    offset: 0,
    maxSize: 100,
    customQuery: "SELECT * FROM users",
    columns: ["id", "name"],
    setFilters: vi.fn(),
    setSorters: vi.fn(),
    setCurrentTable: vi.fn(),
    setColumns: vi.fn(),
    setOffset: vi.fn(),
    setMaxSize: vi.fn(),
    setIsDataLoading: vi.fn(),
    resetPagination: vi.fn(),
    ...overrides
  };
}

describe("useWorkerActions", () => {
  const mockSetSelectedRowObject = vi.fn();
  const mockSetIsInserting = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useDatabaseStore.getState).mockReturnValue(
      createMockStore() as never
    );
    vi.mocked(usePanelManager).mockReturnValue({
      selectedRowObject: { data: [1], index: 0, primaryValue: 1 },
      setSelectedRowObject: mockSetSelectedRowObject,
      setIsInserting: mockSetIsInserting,
      editValues: ["1", "Ada"],
      setEditValues: vi.fn()
    } as never);
    vi.mocked(parseSqlStatements).mockReturnValue(["SELECT * FROM users"]);
    vi.mocked(postWorkerMessage).mockReturnValue(true);
  });

  it("handles table changes by resetting related ui state", () => {
    const workerRef = {
      current: { postMessage: vi.fn() } as unknown as Worker
    };
    const { result } = renderHook(() => useWorkerActions({ workerRef }));

    result.current.handleTableChange("users");

    const store = useDatabaseStore.getState();
    expect(store.setFilters).toHaveBeenCalledWith(null);
    expect(store.setSorters).toHaveBeenCalledWith(null);
    expect(store.resetPagination).toHaveBeenCalled();
    expect(store.setCurrentTable).toHaveBeenCalledWith("users");
    expect(store.setColumns).toHaveBeenCalledWith(["id"]);
  });

  it("shows an error when changing to an unknown table", () => {
    const workerRef = {
      current: { postMessage: vi.fn() } as unknown as Worker
    };
    const { result } = renderHook(() => useWorkerActions({ workerRef }));

    result.current.handleTableChange("missing");

    expect(showToast).toHaveBeenCalledWith(
      "Selected table schema not found",
      "error"
    );
  });

  it("posts a single exec message for a single parsed statement", () => {
    const workerRef = {
      current: { postMessage: vi.fn() } as unknown as Worker
    };
    const { result } = renderHook(() => useWorkerActions({ workerRef }));

    result.current.handleQueryExecute();

    expect(useDatabaseStore.getState().setIsDataLoading).toHaveBeenCalledWith(
      true
    );
    expect(postWorkerMessage).toHaveBeenCalledWith(workerRef.current, {
      action: "exec",
      payload: {
        query: "SELECT * FROM users",
        currentTable: "users",
        filters: null,
        sorters: null,
        limit: 25,
        offset: 0
      }
    });
  });

  it("posts an execBatch message when multiple statements are parsed", () => {
    vi.mocked(parseSqlStatements).mockReturnValue(["SELECT 1", "SELECT 2"]);
    const workerRef = {
      current: { postMessage: vi.fn() } as unknown as Worker
    };
    const { result } = renderHook(() => useWorkerActions({ workerRef }));

    result.current.handleQueryExecute();

    expect(postWorkerMessage).toHaveBeenCalledWith(workerRef.current, {
      action: "execBatch",
      payload: {
        queries: ["SELECT 1", "SELECT 2"],
        currentTable: "users",
        filters: null,
        sorters: null,
        limit: 25,
        offset: 0
      }
    });
  });

  it("shows a delete error when no row is selected", () => {
    vi.mocked(usePanelManager).mockReturnValue({
      selectedRowObject: { data: [], index: 0, primaryValue: null },
      setSelectedRowObject: mockSetSelectedRowObject,
      setIsInserting: mockSetIsInserting,
      editValues: [],
      setEditValues: vi.fn()
    } as never);

    const workerRef = {
      current: { postMessage: vi.fn() } as unknown as Worker
    };
    const { result } = renderHook(() => useWorkerActions({ workerRef }));

    result.current.handleEditSubmit("delete");

    expect(showToast).toHaveBeenCalledWith(
      "No row selected to delete",
      "error"
    );
  });

  it("posts edit and refresh messages when an edit submission succeeds", () => {
    const workerRef = {
      current: { postMessage: vi.fn() } as unknown as Worker
    };
    const { result } = renderHook(() => useWorkerActions({ workerRef }));

    result.current.handleEditSubmit("update");

    expect(useDatabaseStore.getState().setIsDataLoading).toHaveBeenCalledWith(
      true
    );
    expect(postWorkerMessage).toHaveBeenNthCalledWith(1, workerRef.current, {
      action: "update",
      payload: {
        table: "users",
        columns: ["id", "name"],
        values: ["1", "Ada"],
        primaryValue: 1
      }
    });
    expect(postWorkerMessage).toHaveBeenNthCalledWith(2, workerRef.current, {
      action: "refresh",
      payload: {
        currentTable: "users",
        offset: 0,
        limit: 25,
        filters: null,
        sorters: null
      }
    });
  });
});
