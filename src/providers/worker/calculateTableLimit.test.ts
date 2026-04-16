import { describe, expect, it } from "vitest";
import { calculateTableLimit } from "./calculateTableLimit";

function addSizedElement(id: string, height: number) {
  const element = document.createElement("div");
  element.id = id;
  element.getBoundingClientRect = () => ({ height }) as DOMRect;
  document.body.appendChild(element);
}

describe("calculateTableLimit", () => {
  it("falls back to the default when required elements are missing", () => {
    expect(calculateTableLimit(true)).toBe(50);
  });

  it("uses the initial header size on first load", () => {
    addSizedElement("dataSection", 500);
    addSizedElement("paginationControls", 50);

    expect(calculateTableLimit(true)).toBe(12);
  });

  it("uses the measured header size after the first load", () => {
    addSizedElement("dataSection", 500);
    addSizedElement("paginationControls", 50);
    addSizedElement("tableHeader", 60);

    expect(calculateTableLimit(false)).toBe(11);
  });
});
