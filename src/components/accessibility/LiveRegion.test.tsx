import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import LiveRegion from "./LiveRegion";

vi.mock("@/store/useDatabaseStore", () => ({
  useDatabaseStore: vi.fn()
}));

const storeState: {
  isDatabaseLoading: boolean;
  isDataLoading: boolean;
  currentTable: string | null;
  data: Array<Array<number | string>> | null;
  maxSize: number;
} = {
  isDatabaseLoading: false,
  isDataLoading: false,
  currentTable: null,
  data: null,
  maxSize: 0
};

describe("LiveRegion", () => {
  beforeEach(() => {
    vi.mocked(useDatabaseStore).mockImplementation((selector) =>
      selector(storeState as never)
    );
  });

  it("announces database and table loading states", () => {
    storeState.isDatabaseLoading = true;
    const { rerender } = render(<LiveRegion />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading database, please wait..."
    );

    storeState.isDatabaseLoading = false;
    storeState.isDataLoading = true;
    rerender(<LiveRegion />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading table data..."
    );
  });

  it("announces loaded row counts and empty tables", () => {
    storeState.isDataLoading = false;
    storeState.currentTable = "users";
    storeState.data = [
      [1, "Ada"],
      [2, "Grace"]
    ];
    storeState.maxSize = 10;
    const { rerender } = render(<LiveRegion />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loaded 2 rows from users table. Total rows: 10"
    );

    storeState.data = [];
    rerender(<LiveRegion />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "users table is empty"
    );
  });
});
