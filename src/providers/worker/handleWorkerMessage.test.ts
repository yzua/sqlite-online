import { beforeEach, describe, expect, it, vi } from "vitest";
import showToast from "@/lib/toast";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { createWorkerMessageHandler } from "./handleWorkerMessage";

vi.mock("@/lib/toast", () => ({
  default: vi.fn()
}));

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: { getState: vi.fn() }
}));

function createStoreMock() {
  return {
    applyInit: vi.fn(),
    applySchemaUpdate: vi.fn(),
    applyQueryResults: vi.fn(),
    applyCustomQueryResults: vi.fn(),
    clearDataLoading: vi.fn(),
    clearDataLoadingAndError: vi.fn(),
    setIsDatabaseLoading: vi.fn(),
    setErrorMessage: vi.fn()
  };
}

function createPanelActions() {
  return {
    handleCloseEdit: vi.fn(),
    setSelectedRowObject: vi.fn(),
    setIsInserting: vi.fn()
  };
}

describe("createWorkerMessageHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes state from an initComplete message", () => {
    const store = createStoreMock();
    vi.mocked(useDatabaseStore.getState).mockReturnValue(store as never);

    const panelActions = createPanelActions();
    const handler = createWorkerMessageHandler(panelActions);
    const postMessage = vi.fn();
    Object.defineProperty(window, "parent", {
      configurable: true,
      value: { postMessage }
    });

    handler({
      data: {
        action: "initComplete",
        payload: {
          tableSchema: {
            users: {
              primaryKey: "id",
              type: "table",
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
          indexSchema: [],
          currentTable: "users"
        }
      }
    } as MessageEvent);

    expect(postMessage).toHaveBeenCalledWith(
      { type: "loadDatabaseBufferReady" },
      "*"
    );
    expect(store.applyInit).toHaveBeenCalledWith(
      {
        users: {
          primaryKey: "id",
          type: "table",
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
      [],
      "users",
      ["id"]
    );
  });

  it("stores query results and clears data loading", () => {
    const store = createStoreMock();
    vi.mocked(useDatabaseStore.getState).mockReturnValue(store as never);

    const panelActions = createPanelActions();
    const handler = createWorkerMessageHandler(panelActions);

    handler({
      data: {
        action: "queryComplete",
        payload: {
          results: [{ values: [[1, "Ada"]], columns: ["id", "name"] }],
          maxSize: 20
        }
      }
    } as MessageEvent);

    expect(store.applyQueryResults).toHaveBeenCalledWith([[1, "Ada"]], 20);
  });

  it("stores custom query results and clears error state", () => {
    const store = createStoreMock();
    vi.mocked(useDatabaseStore.getState).mockReturnValue(store as never);

    const panelActions = createPanelActions();
    const handler = createWorkerMessageHandler(panelActions);

    handler({
      data: {
        action: "customQueryComplete",
        payload: {
          results: [{ values: [[1]], columns: ["id"] }]
        }
      }
    } as MessageEvent);

    expect(store.applyCustomQueryResults).toHaveBeenCalledWith({
      data: [[1]],
      columns: ["id"]
    });
  });

  it("shows download/export success toasts and triggers downloads", () => {
    const store = createStoreMock();
    vi.mocked(useDatabaseStore.getState).mockReturnValue(store as never);

    const panelActions = createPanelActions();
    const handler = createWorkerMessageHandler(panelActions);
    const click = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockReturnValue({
      click,
      href: "",
      download: ""
    } as unknown as HTMLAnchorElement);
    const createObjectURL = vi.fn().mockReturnValue("blob:url");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL
    });

    handler({
      data: {
        action: "downloadComplete",
        payload: { bytes: new ArrayBuffer(8) }
      }
    } as MessageEvent);
    handler({
      data: { action: "exportComplete", payload: { results: "a,b\n1,2" } }
    } as MessageEvent);

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(click).toHaveBeenCalledTimes(2);
    expect(showToast).toHaveBeenCalledWith(
      "Database downloaded successfully",
      "success"
    );
    expect(showToast).toHaveBeenCalledWith(
      "Database exported successfully",
      "success"
    );

    createElement.mockRestore();
  });

  it("routes query errors to toast and custom query state", () => {
    const store = createStoreMock();
    vi.mocked(useDatabaseStore.getState).mockReturnValue(store as never);

    const panelActions = createPanelActions();
    const handler = createWorkerMessageHandler(panelActions);
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    handler({
      data: {
        action: "queryError",
        payload: {
          error: {
            message: "Bad SQL",
            isCustomQueryError: true
          }
        }
      }
    } as MessageEvent);

    expect(store.setErrorMessage).toHaveBeenCalledWith("Bad SQL");
    expect(store.clearDataLoading).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Bad SQL", "error");
  });
});
