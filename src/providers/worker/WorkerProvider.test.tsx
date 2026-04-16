import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import usePanelManager from "@/hooks/usePanel";
import { calculateTableLimit } from "@/lib/calculateTableLimit";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { createWorkerMessageHandler } from "./handleWorkerMessage";
import { postWorkerMessage } from "./postWorkerMessage";
import { useIframeBridge } from "./useIframeBridge";
import { useWorkerActions } from "./useWorkerActions";
import { useWorkerHotkeys } from "./useWorkerHotkeys";
import DatabaseWorkerProvider from "./WorkerProvider";

vi.mock("@/hooks/usePanel", () => ({
  default: vi.fn()
}));

vi.mock("@/lib/calculateTableLimit", () => ({
  calculateTableLimit: vi.fn()
}));

vi.mock("@/sqlite/sqliteWorker.ts?worker", () => ({
  default: class MockSqliteWorker {
    onerror = null;
    onmessage = null;
    onmessageerror = null;
    terminate = vi.fn();
  }
}));

vi.mock("./handleWorkerMessage", () => ({
  createWorkerMessageHandler: vi.fn()
}));

vi.mock("./postWorkerMessage", () => ({
  postWorkerMessage: vi.fn()
}));

vi.mock("./useIframeBridge", () => ({
  useIframeBridge: vi.fn()
}));

vi.mock("./useWorkerActions", () => ({
  useWorkerActions: vi.fn()
}));

vi.mock("./useWorkerHotkeys", () => ({
  useWorkerHotkeys: vi.fn()
}));

const initialStoreState = useDatabaseStore.getState();
const initialInnerHeight = window.innerHeight;

describe("WorkerProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    useDatabaseStore.setState({
      currentTable: "users",
      filters: null,
      sorters: null,
      offset: 0,
      limit: 50,
      isDataLoading: false
    });

    vi.mocked(usePanelManager).mockReturnValue({
      handleCloseEdit: vi.fn(),
      setSelectedRowObject: vi.fn(),
      setIsInserting: vi.fn(),
      handleInsert: vi.fn(),
      handleRowClick: vi.fn(),
      isEditing: false,
      isInserting: false,
      selectedRowObject: null,
      editValues: [],
      setEditValues: vi.fn()
    } as never);

    vi.mocked(createWorkerMessageHandler).mockReturnValue(vi.fn());
    vi.mocked(postWorkerMessage).mockReturnValue(true);
    vi.mocked(useIframeBridge).mockImplementation(() => {});
    vi.mocked(useWorkerHotkeys).mockImplementation(() => {});
    vi.mocked(useWorkerActions).mockReturnValue({
      handleFileUpload: vi.fn(),
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
  });

  afterEach(() => {
    useDatabaseStore.setState(initialStoreState, true);
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: initialInnerHeight
    });
    vi.useRealTimers();
  });

  it("re-fetches table data with a recalculated limit on window resize", () => {
    vi.mocked(calculateTableLimit)
      .mockReturnValueOnce(12)
      .mockReturnValueOnce(11)
      .mockReturnValueOnce(8);

    render(
      <DatabaseWorkerProvider>
        <div>child</div>
      </DatabaseWorkerProvider>
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const initialFetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(initialFetchCalls).toHaveLength(1);
    expect(initialFetchCalls[0]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 12, offset: 0 }
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const settledFetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(settledFetchCalls).toHaveLength(2);
    expect(settledFetchCalls[1]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 11, offset: 0 }
    });

    act(() => {
      Object.defineProperty(window, "innerHeight", {
        configurable: true,
        writable: true,
        value: 700
      });
      window.dispatchEvent(new Event("resize"));
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const resizedFetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(resizedFetchCalls).toHaveLength(3);
    expect(resizedFetchCalls[2]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 8, offset: 0 }
    });
    expect(useDatabaseStore.getState().limit).toBe(8);
  });
});
