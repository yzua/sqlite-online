import showToast from "@/components/common/Toaster/Toast";

interface WorkerMessage {
  action: string;
  payload?: unknown;
}

export function postWorkerMessage(
  worker: Worker | null,
  message: WorkerMessage
): worker is Worker {
  if (!worker) {
    showToast("Worker is not initialized", "error");
    return false;
  }

  worker.postMessage(message);
  return true;
}
