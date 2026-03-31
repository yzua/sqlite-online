export function getCurrentPage(offset: number, limit: number) {
  return Math.floor(offset / limit) + 1;
}

export function getTotalPages(maxSize: number, limit: number) {
  return Math.ceil(maxSize / limit);
}

export function getVisibleRange(
  offset: number,
  limit: number,
  maxSize: number
) {
  return {
    start: offset + 1,
    end: offset + limit > maxSize ? maxSize : offset + limit
  };
}

export function isAtFirstPage(offset: number) {
  return offset === 0;
}

export function isAtLastPage(offset: number, limit: number, maxSize: number) {
  return offset + limit >= maxSize;
}
