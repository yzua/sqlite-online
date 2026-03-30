import { useEffect, useState } from "react";
import { useDatabaseStore } from "@/store/useDatabaseStore";

function LiveRegion() {
  const [message, setMessage] = useState("");
  const isDatabaseLoading = useDatabaseStore(
    (state) => state.isDatabaseLoading
  );
  const isDataLoading = useDatabaseStore((state) => state.isDataLoading);
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const data = useDatabaseStore((state) => state.data);
  const maxSize = useDatabaseStore((state) => state.maxSize);

  useEffect(() => {
    if (isDatabaseLoading) {
      setMessage("Loading database, please wait...");
    } else if (isDataLoading) {
      setMessage("Loading table data...");
    } else if (currentTable && data) {
      const rowCount = data.length;
      const totalRows = maxSize || 0;
      setMessage(
        `Loaded ${rowCount} rows from ${currentTable} table. Total rows: ${totalRows}`
      );
    } else if (currentTable && !data?.length) {
      setMessage(`${currentTable} table is empty`);
    } else {
      setMessage("");
    }
  }, [isDatabaseLoading, isDataLoading, currentTable, data, maxSize]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="live-region"
    >
      {message}
    </div>
  );
}

export default LiveRegion;
