import useKeyPress from "@/hooks/useKeyPress";
import type { EditTypes } from "@/types";

interface UseWorkerHotkeysProps {
  handleDownload: () => void;
  handleEditSubmit: (type: EditTypes) => void;
  handleQueryExecute: () => void;
  handlePageChange: (type: "next" | "prev" | "first" | "last") => void;
}

export function useWorkerHotkeys({
  handleDownload,
  handleEditSubmit,
  handleQueryExecute,
  handlePageChange
}: UseWorkerHotkeysProps) {
  useKeyPress("ctrl+s", () => handleDownload());

  useKeyPress("ctrl+I", () => handleEditSubmit("insert"), true);
  useKeyPress("ctrl+u", () => handleEditSubmit("update"));
  useKeyPress("ctrl+d", () => handleEditSubmit("delete"));

  useKeyPress("ctrl+q", () => handleQueryExecute());

  useKeyPress("ctrl+ArrowRight", () => handlePageChange("next"));
  useKeyPress("ctrl+ArrowUp", () => handlePageChange("first"));
  useKeyPress("ctrl+ArrowDown", () => handlePageChange("last"));
  useKeyPress("ctrl+ArrowLeft", () => handlePageChange("prev"));
}
