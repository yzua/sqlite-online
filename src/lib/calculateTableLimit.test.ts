import { beforeEach, describe, expect, it } from "vitest";
import { calculateTableLimit } from "./calculateTableLimit";

function addSizedElement({
  id,
  height,
  top = 0,
  tagName = "div",
  attributes
}: {
  id?: string;
  height: number;
  top?: number;
  tagName?: keyof HTMLElementTagNameMap;
  attributes?: Record<string, string>;
}) {
  const element = document.createElement(tagName);
  if (id) {
    element.id = id;
  }
  for (const [name, value] of Object.entries(attributes ?? {})) {
    element.setAttribute(name, value);
  }
  element.getBoundingClientRect = () =>
    ({ height, top, bottom: top + height }) as DOMRect;
  document.body.appendChild(element);

  return element;
}

function addMeasuredTableRow(height: number) {
  const table = addSizedElement({ tagName: "table", height: 0 });
  const tableBody = addSizedElement({
    tagName: "tbody",
    height: 0,
    attributes: { "data-slot": "table-body" }
  });
  const row = addSizedElement({
    tagName: "tr",
    height,
    attributes: { "data-slot": "table-row" }
  });

  tableBody.appendChild(row);
  table.appendChild(tableBody);
}

describe("calculateTableLimit", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("falls back to the default when required elements are missing", () => {
    expect(calculateTableLimit()).toBe(50);
  });

  it("uses the initial header size on first load", () => {
    addSizedElement({ id: "dataSection", height: 500 });
    addSizedElement({ id: "paginationControls", height: 50 });

    expect(calculateTableLimit()).toBe(12);
  });

  it("uses the measured header size after the first load", () => {
    addSizedElement({ id: "dataSection", height: 500 });
    addSizedElement({ id: "paginationControls", height: 50 });
    addSizedElement({ id: "tableHeader", height: 60 });

    expect(calculateTableLimit()).toBe(11);
  });

  it("uses the measured row height when table rows are rendered", () => {
    addSizedElement({ id: "dataSection", height: 500 });
    addSizedElement({ id: "paginationControls", height: 50 });
    addSizedElement({ id: "tableHeader", height: 60 });
    addMeasuredTableRow(40);

    expect(calculateTableLimit()).toBe(9);
  });

  it("keeps at least one row visible when space is tight", () => {
    addSizedElement({ id: "dataSection", height: 120 });
    addSizedElement({ id: "paginationControls", height: 40 });
    addSizedElement({ id: "tableHeader", height: 60 });
    addMeasuredTableRow(40);

    expect(calculateTableLimit()).toBe(1);
  });

  it("caps the row limit to the visible viewport when the panel extends below it", () => {
    addSizedElement({ id: "dataSection", height: 765, top: 151 });
    addSizedElement({ id: "paginationControls", height: 50 });
    addSizedElement({ id: "tableHeader", height: 50 });

    expect(calculateTableLimit(894)).toBe(19);
  });
});
