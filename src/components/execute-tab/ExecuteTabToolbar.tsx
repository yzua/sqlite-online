import {
  FolderOutputIcon,
  LoaderCircleIcon,
  PlayIcon,
  SparklesIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExecuteTabToolbarProps {
  isAiLoading: boolean;
  isDataLoading: boolean;
  isDatabaseLoading: boolean;
  canExport: boolean;
  onExecute: () => void;
  onExport: () => void;
  onOpenGemini: () => void;
}

function ExecuteTabToolbar({
  isAiLoading,
  isDataLoading,
  isDatabaseLoading,
  canExport,
  onExecute,
  onExport,
  onOpenGemini
}: ExecuteTabToolbarProps) {
  const isLoading = isDataLoading || isDatabaseLoading;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b px-1 py-2">
      <Button
        size="sm"
        variant="outline"
        className="min-w-[11rem] text-xs"
        onClick={onExecute}
        disabled={isAiLoading}
        title="Execute SQL"
      >
        {isAiLoading ? (
          <LoaderCircleIcon className="mr-1 h-3 w-3 animate-spin" />
        ) : (
          <PlayIcon className="mr-1 h-3 w-3" />
        )}
        Execute SQL
      </Button>

      <Button
        onClick={onExport}
        size="sm"
        variant="outline"
        className="text-xs"
        disabled={!canExport}
      >
        <FolderOutputIcon className="mr-1 h-3 w-3" />
        Export data
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="text-xs"
        onClick={onOpenGemini}
      >
        <SparklesIcon className="mr-1 h-3 w-3" />
        Gemini
      </Button>

      {isLoading && (
        <span className="text-muted-foreground ml-2 flex items-center text-sm">
          <LoaderCircleIcon className="mr-1 h-3 w-3 animate-spin" />
          Loading data
        </span>
      )}
    </div>
  );
}

export default ExecuteTabToolbar;
