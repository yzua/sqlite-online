import { DatabaseIcon, TableIcon } from "lucide-react";

interface QueryResultsEmptyStateProps {
  hasQuery: boolean;
  columnCount?: number;
}

function QueryResultsEmptyState({
  hasQuery,
  columnCount = 0
}: QueryResultsEmptyStateProps) {
  if (!hasQuery) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <div className="bg-primary/10 rounded-full p-4">
          <DatabaseIcon className="text-primary/70 h-8 w-8" />
        </div>
        <div className="text-center">
          <h3 className="mb-1 font-medium">No Query Results</h3>
          <p className="text-muted-foreground max-w-md text-sm">
            Execute a SQL query to view the results here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full shadow-sm">
      <div className="bg-primary/5 border-b p-3">
        <div className="flex items-center gap-2">
          <TableIcon className="text-primary/70 h-4 w-4" />
          <h3 className="text-sm font-medium">Query Results</h3>
          <span className="bg-primary/10 rounded-full px-2 py-0.5 text-xs">
            {columnCount} columns
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-primary/5 mb-4 rounded-full p-4">
          <TableIcon className="text-primary/50 h-6 w-6" />
        </div>
        <p className="text-md mb-1 font-medium">Query returned no results</p>
        <p className="text-muted-foreground text-sm">
          Your query executed successfully but returned no data
        </p>
      </div>
    </div>
  );
}

export default QueryResultsEmptyState;
