import { useCallback, useEffect } from "react";

/**
 * Wires up cross-frame database loading.
 *
 * Exposes `window.loadDatabaseBuffer` for same-origin callers and listens
 * for `invokeLoadDatabaseBuffer` postMessage events from parent frames.
 */
export function useIframeBridge(
  loadDatabaseBuffer: (buffer: ArrayBuffer) => void
) {
  const stableLoad = useCallback(
    (buffer: ArrayBuffer) => {
      loadDatabaseBuffer(buffer);
    },
    [loadDatabaseBuffer]
  );

  useEffect(() => {
    window.loadDatabaseBuffer = stableLoad;

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type !== "invokeLoadDatabaseBuffer") return;

      const buffer = event.data.buffer as ArrayBuffer;

      try {
        stableLoad(buffer);
        event.source?.postMessage(
          { type: "loadDatabaseBufferSuccess" },
          event.origin as WindowPostMessageOptions
        );
      } catch (error: unknown) {
        event.source?.postMessage(
          {
            type: "loadDatabaseBufferError",
            error: error instanceof Error ? error.message : String(error)
          },
          event.origin as WindowPostMessageOptions
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [stableLoad]);
}
