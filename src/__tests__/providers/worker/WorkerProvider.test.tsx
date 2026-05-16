import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  useEditValues,
  usePanelActions,
  usePanelState
} from "@/hooks/usePanel";
import { BROWSE_TABLE_LAYOUT_EVENT } from "@/hooks/useTableLimit";
import { calculateTableLimit } from "@/lib/calculateTableLimit";
import { createWorkerMessageHandler } from "@/providers/worker/handleWorkerMessage";
import { postWorkerMessage } from "@/providers/worker/postWorkerMessage";
import { useIframeBridge } from "@/providers/worker/useIframeBridge";
import { useWorkerActions } from "@/providers/worker/useWorkerActions";
import { useWorkerHotkeys } from "@/providers/worker/useWorkerHotkeys";
import DatabaseWorkerProvider from "@/providers/worker/WorkerProvider";
import { useDatabaseStore } from "@/store/useDatabaseStore";

vi.mock("@/hooks/usePanel", () => ({
  default: vi.fn(),
  usePanelActions: vi.fn(),
  usePanelState: vi.fn(),
  useEditValues: vi.fn()
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

vi.mock("@/providers/worker/handleWorkerMessage", () => ({
  createWorkerMessageHandler: vi.fn()
}));

vi.mock("@/providers/worker/postWorkerMessage", () => ({
  postWorkerMessage: vi.fn()
}));

vi.mock("@/providers/worker/useIframeBridge", () => ({
  useIframeBridge: vi.fn()
}));

vi.mock("@/providers/worker/useWorkerActions", () => ({
  useWorkerActions: vi.fn()
}));

vi.mock("@/providers/worker/useWorkerHotkeys", () => ({
  useWorkerHotkeys: vi.fn()
}));

const initialStoreState = useDatabaseStore.getState();
const initialInnerHeight = window.innerHeight;
const initialResizeObserver = globalThis.ResizeObserver;

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

    vi.mocked(usePanelActions).mockReturnValue({
      handleCloseEdit: vi.fn(),
      setSelectedRowObject: vi.fn(),
      setIsInserting: vi.fn(),
      handleInsert: vi.fn(),
      handleRowClick: vi.fn(),
      setEditValues: vi.fn()
    } as never);

    vi.mocked(usePanelState).mockReturnValue({
      isEditing: false,
      isInserting: false,
      selectedRowObject: null
    });

    vi.mocked(useEditValues).mockReturnValue({ editValues: [] });

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
    globalThis.ResizeObserver = initialResizeObserver;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: initialInnerHeight
    });
    vi.useRealTimers();
  });

  it("re-fetches table data with a recalculated limit when ResizeObserver fires", () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    let currentLimit = 12;

    globalThis.ResizeObserver = vi.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn()
      };
    }) as typeof ResizeObserver;

    vi.mocked(calculateTableLimit).mockImplementation(() => currentLimit);

    render(
      <DatabaseWorkerProvider>
        <div>child</div>
      </DatabaseWorkerProvider>
    );

    act(() => {
      vi.advanceTimersByTime(0);
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
      currentLimit = 8;
      resizeCallback?.([], {} as ResizeObserver);
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const resizedFetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(resizedFetchCalls).toHaveLength(2);
    expect(resizedFetchCalls[1]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 8, offset: 0 }
    });
    expect(useDatabaseStore.getState().limit).toBe(8);
  });

  it("re-fetches table data with a recalculated limit on window resize", () => {
    let currentLimit = 12;

    vi.mocked(calculateTableLimit).mockImplementation(() => currentLimit);

    render(
      <DatabaseWorkerProvider>
        <div>child</div>
      </DatabaseWorkerProvider>
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      currentLimit = 8;
      window.dispatchEvent(new Event("resize"));
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const fetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 12, offset: 0 }
    });
    expect(fetchCalls[1]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 8, offset: 0 }
    });
  });

  it("re-fetches table data when the browse tab layout remounts", () => {
    let currentLimit = 50;

    vi.mocked(calculateTableLimit).mockImplementation(() => currentLimit);

    render(
      <DatabaseWorkerProvider>
        <div>child</div>
      </DatabaseWorkerProvider>
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    act(() => {
      currentLimit = 19;
      window.dispatchEvent(new Event(BROWSE_TABLE_LAYOUT_EVENT));
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const fetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 50, offset: 0 }
    });
    expect(fetchCalls[1]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 19, offset: 0 }
    });
  });

  it("recalculates the table limit when the current table becomes available", () => {
    useDatabaseStore.setState({
      currentTable: null,
      filters: null,
      sorters: null,
      offset: 0,
      limit: 50,
      isDataLoading: false
    });

    let currentLimit = 3;
    vi.mocked(calculateTableLimit).mockImplementation(() => currentLimit);

    render(
      <DatabaseWorkerProvider>
        <div>child</div>
      </DatabaseWorkerProvider>
    );

    act(() => {
      currentLimit = 12;
      useDatabaseStore.setState({ currentTable: "users" });
    });

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const fetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 12, offset: 0 }
    });
  });

  it("re-fetches table data when the data section resizes without a window resize", () => {
    let resizeCallback: ResizeObserverCallback | undefined;
    let currentLimit = 3;

    globalThis.ResizeObserver = vi.fn().mockImplementation((callback) => {
      resizeCallback = callback;
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn()
      };
    }) as typeof ResizeObserver;

    vi.mocked(calculateTableLimit).mockImplementation(() => currentLimit);

    render(
      <DatabaseWorkerProvider>
        <div>child</div>
      </DatabaseWorkerProvider>
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(resizeCallback).toBeDefined();

    act(() => {
      currentLimit = 19;
      resizeCallback?.([], {} as ResizeObserver);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    const fetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 3, offset: 0 }
    });
    expect(fetchCalls[1]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 19, offset: 0 }
    });
  });

  it("re-fetches once when the post-render limit correction changes the row count", () => {
    let currentLimit = 3;

    vi.mocked(calculateTableLimit).mockImplementation(() => currentLimit);

    render(
      <DatabaseWorkerProvider>
        <div>child</div>
      </DatabaseWorkerProvider>
    );

    act(() => {
      vi.advanceTimersByTime(0);
    });

    // Change the limit mock — in the old code, a correction timeout at 50ms
    // should fire a second fetch after the browse panel reaches its final
    // measured height.
    act(() => {
      currentLimit = 19;
      vi.advanceTimersByTime(100);
    });

    const fetchCalls = vi
      .mocked(postWorkerMessage)
      .mock.calls.filter(([, message]) => message.action === "getTableData");

    expect(fetchCalls).toHaveLength(2);
    expect(fetchCalls[0]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 3, offset: 0 }
    });
    expect(fetchCalls[1]?.[1]).toMatchObject({
      action: "getTableData",
      payload: { currentTable: "users", limit: 19, offset: 0 }
    });
  });
});
