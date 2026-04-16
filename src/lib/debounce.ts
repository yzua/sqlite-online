export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  ms: number
): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, ms);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}
