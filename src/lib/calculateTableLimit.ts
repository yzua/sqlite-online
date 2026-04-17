const TABLE_ROW_HEIGHT = 33;
const TABLE_HEADER_HEIGHT = 47.5;
const DEFAULT_LIMIT = 50;
const MINIMUM_VISIBLE_ROWS = 1;

function getElementHeight(id: string) {
  return document.getElementById(id)?.getBoundingClientRect().height;
}

function getElementTop(id: string) {
  return document.getElementById(id)?.getBoundingClientRect().top;
}

function getFirstTableRowHeight() {
  return document
    .querySelector('[data-slot="table-body"] [data-slot="table-row"]')
    ?.getBoundingClientRect().height;
}

export function calculateTableLimit(viewportHeight = window.innerHeight) {
  const dataSectionHeight = getElementHeight("dataSection");
  const dataSectionTop = getElementTop("dataSection");
  const paginationControlsHeight = getElementHeight("paginationControls");

  if (dataSectionHeight == null || paginationControlsHeight == null) {
    return DEFAULT_LIMIT;
  }

  const tableHeaderHeight =
    getElementHeight("tableHeader") ?? TABLE_HEADER_HEIGHT;
  const tableRowHeight = getFirstTableRowHeight() ?? TABLE_ROW_HEIGHT;
  const visibleDataSectionHeight =
    dataSectionTop == null
      ? dataSectionHeight
      : Math.min(
          dataSectionHeight,
          Math.max(viewportHeight - dataSectionTop, 0)
        );
  const availableHeight =
    visibleDataSectionHeight - tableHeaderHeight - paginationControlsHeight;

  return Math.max(
    MINIMUM_VISIBLE_ROWS,
    Math.floor(availableHeight / tableRowHeight)
  );
}
