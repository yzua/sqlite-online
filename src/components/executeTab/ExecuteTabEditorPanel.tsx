import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import CustomQueryDataTable from "./CustomQueryDataTable";
import CustomSQLTextarea from "./CustomSQLTextarea";

interface ExecuteTabEditorPanelProps {
  errorMessage: string | null;
  onDismissError: () => void;
}

function ExecuteTabEditorPanel({
  errorMessage,
  onDismissError
}: ExecuteTabEditorPanelProps) {
  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel defaultSize={25}>
        {errorMessage && (
          <div className="flex items-center justify-between p-2">
            <div className="text-sm text-red-400">{errorMessage}</div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onDismissError}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        )}
        <CustomSQLTextarea />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={75}>
        <div className="flex h-full flex-col justify-between border">
          <CustomQueryDataTable />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export default ExecuteTabEditorPanel;
