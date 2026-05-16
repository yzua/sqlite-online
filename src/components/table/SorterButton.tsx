import {
  ArrowDownNarrowWideIcon,
  ArrowUpDownIcon,
  ArrowUpNarrowWideIcon
} from "lucide-react";
import { memo } from "react";
import useDatabaseWorker from "@/hooks/useWorker";
import { useDatabaseStore } from "@/store/useDatabaseStore";

interface SorterButtonProps {
  column: string;
}

const SorterButton = memo(({ column }: SorterButtonProps) => {
  // Subscribe to only this column's sort direction — avoids re-rendering
  // every SorterButton when a different column's sort changes.
  const sortDirection = useDatabaseStore(
    (state) => state.sorters?.[column] ?? null
  );
  const { handleQuerySorter } = useDatabaseWorker();

  if (sortDirection === "asc") {
    return (
      <button
        title="Sort column in descending order"
        type="button"
        aria-label="Sort descending"
        className="cursor-pointer"
        onClick={() => handleQuerySorter(column)}
      >
        <ArrowDownNarrowWideIcon className="h-3 w-3" />
      </button>
    );
  }

  if (sortDirection === "desc") {
    return (
      <button
        title="Sort column in ascending order"
        type="button"
        aria-label="Sort ascending"
        className="cursor-pointer"
        onClick={() => handleQuerySorter(column)}
      >
        <ArrowUpNarrowWideIcon className="h-3 w-3" />
      </button>
    );
  }

  return (
    <button
      title="Sort column in ascending order"
      type="button"
      aria-label="Sort column"
      className="cursor-pointer"
      onClick={() => handleQuerySorter(column)}
    >
      <ArrowUpDownIcon className="h-3 w-3" />
    </button>
  );
});

export default SorterButton;
