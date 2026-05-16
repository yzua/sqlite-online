import showToast from "@/components/common/toast";
import type { WorkerEvent } from "@/types/worker-protocol";

export function postWorkerMessage(
  worker: Worker | null,
  message: WorkerEvent,
  transfer?: Transferable[]
): worker is Worker {
  if (!worker) {
    showToast("Worker is not initialized", "error");
    return false;
  }

  worker.postMessage(message, transfer ?? []);
  return true;
}
