const TABLE_ROW_HEIGHT = 33;
const INITIAL_TABLE_HEADER_HEIGHT = 47.5;
const DEFAULT_LIMIT = 50;

function getElementHeight(id: string) {
  return document.getElementById(id)?.getBoundingClientRect().height;
}

export function calculateTableLimit(isFirstTimeLoading: boolean) {
  const dataSectionHeight = getElementHeight("dataSection");
  const paginationControlsHeight = getElementHeight("paginationControls");

  if (!dataSectionHeight || !paginationControlsHeight) {
    return DEFAULT_LIMIT;
  }

  const tableHeaderHeight = isFirstTimeLoading
    ? INITIAL_TABLE_HEADER_HEIGHT
    : getElementHeight("tableHeader");

  if (!tableHeaderHeight) {
    return DEFAULT_LIMIT;
  }

  return Math.floor(
    (dataSectionHeight - tableHeaderHeight - paginationControlsHeight) /
      TABLE_ROW_HEIGHT
  );
}
