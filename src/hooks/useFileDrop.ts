import { useState, useCallback, useEffect } from "react";
import useDatabaseWorker from "@/hooks/useWorker";
import showToast from "@/components/common/Toaster/Toast";

const useFileDrop = () => {
  const { handleFileUpload } = useDatabaseWorker();
  const [isDragging, setIsDragging] = useState(false);

  // Handle when user drags over the drop zone
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Only show drop indicator if files are being dragged
    if (
      event.dataTransfer?.types &&
      (event.dataTransfer.types.includes("Files") ||
        event.dataTransfer.types.includes("application/x-moz-file"))
    ) {
      setIsDragging(true);
    }
  }, []);

  // Handle when user leaves the drop zone
  const handleDragLeave = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Check if the drag leave event is for the window boundary
    if (event.target === document.documentElement) {
      setIsDragging(false);
    }
  }, []);

  // Handle when user drops file
  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);

      try {
        // Check if we have files in the dataTransfer
        if (
          !event.dataTransfer?.types?.includes("Files") &&
          !event.dataTransfer?.types?.includes("application/x-moz-file")
        ) {
          return; // Not a file drop, ignore
        }

        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) {
          showToast("No file detected", "error");
          return;
        }

        const file = files[0];
        handleFileUpload(file);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to process file";
        showToast(`Failed to process file: ${errorMessage}`, "error");
      }
    },
    [handleFileUpload]
  );

  useEffect(() => {
    window.addEventListener("dragover", handleDragOver);
    window.addEventListener("dragleave", handleDragLeave);
    window.addEventListener("drop", handleDrop);

    return () => {
      window.removeEventListener("dragover", handleDragOver);
      window.removeEventListener("dragleave", handleDragLeave);
      window.removeEventListener("drop", handleDrop);
    };
  }, [handleDragOver, handleDragLeave, handleDrop]);

  return { isDragging };
};

export default useFileDrop;
