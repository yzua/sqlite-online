import { useDatabaseStore } from "@/store/useDatabaseStore";

function LiveRegion() {
  const isDatabaseLoading = useDatabaseStore(
    (state) => state.isDatabaseLoading
  );
  const isDataLoading = useDatabaseStore((state) => state.isDataLoading);
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const data = useDatabaseStore((state) => state.data);
  const maxSize = useDatabaseStore((state) => state.maxSize);

  let message = "";

  if (isDatabaseLoading) {
    message = "Loading database, please wait...";
  } else if (isDataLoading) {
    message = "Loading table data...";
  } else if (currentTable && data) {
    const rowCount = data.length;
    const totalRows = maxSize || 0;
    message = `Loaded ${rowCount} rows from ${currentTable} table. Total rows: ${totalRows}`;
  } else if (currentTable && !data?.length) {
    message = `${currentTable} table is empty`;
  }

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
