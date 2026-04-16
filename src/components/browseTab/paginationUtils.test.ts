import { describe, expect, it } from "vitest";
import {
  getCurrentPage,
  getTotalPages,
  getVisibleRange,
  isAtFirstPage,
  isAtLastPage
} from "./paginationUtils";

describe("paginationUtils", () => {
  it("calculates current and total pages", () => {
    expect(getCurrentPage(0, 25)).toBe(1);
    expect(getCurrentPage(50, 25)).toBe(3);
    expect(getTotalPages(101, 25)).toBe(5);
  });

  it("returns the visible row range with end clamping", () => {
    expect(getVisibleRange(0, 25, 100)).toEqual({ start: 1, end: 25 });
    expect(getVisibleRange(75, 25, 90)).toEqual({ start: 76, end: 90 });
  });

  it("detects first and last page boundaries", () => {
    expect(isAtFirstPage(0)).toBe(true);
    expect(isAtFirstPage(25)).toBe(false);
    expect(isAtLastPage(75, 25, 90)).toBe(true);
    expect(isAtLastPage(50, 25, 90)).toBe(false);
  });
});
