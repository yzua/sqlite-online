import { LoaderCircleIcon } from "lucide-react";
import { useLayoutEffect } from "react";
import SchemaTreePanel from "@/components/structure-tab/SchemaTreePanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { usePanelSizing } from "@/hooks/usePanelSizing";
import { BROWSE_TABLE_LAYOUT_EVENT } from "@/hooks/useTableLimit";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import ActionButtons from "./ActionButtons";
import DataTable from "./DataTable";
import EditOverlay from "./EditOverlay";
import PaginationControls from "./PaginationControls";
import TableSelector from "./TableSelector";

function BrowseTab() {
  const isDataLoading = useDatabaseStore((state) => state.isDataLoading);
  const isDatabaseLoading = useDatabaseStore(
    (state) => state.isDatabaseLoading
  );

  const {
    dataPanelSize,
    schemaPanelSize,
    setDataPanelSize,
    setSchemaPanelSize
  } = usePanelSizing();

  useLayoutEffect(() => {
    window.dispatchEvent(new Event(BROWSE_TABLE_LAYOUT_EVENT));
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex flex-wrap items-center gap-1 border-b px-1 py-2"
        role="toolbar"
        aria-label="Table controls and actions"
      >
        <TableSelector />
        <ActionButtons />
        {(isDataLoading || isDatabaseLoading) && (
          <span className="text-muted-foreground ml-2 flex items-center text-sm">
            <LoaderCircleIcon
              className="mr-1 h-3 w-3 animate-spin"
              aria-hidden="true"
            />
            Loading data
          </span>
        )}
      </div>

      <div className="relative h-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            id="dataPanel"
            defaultSize={dataPanelSize}
            onResize={setDataPanelSize}
            className="min-w-0"
          >
            <div
              className="flex h-full min-h-0 flex-col border-l"
              id="dataSection"
            >
              <DataTable />
              <PaginationControls />
            </div>
          </ResizablePanel>

          <ResizableHandle className="hidden md:flex" withHandle />

          <ResizablePanel
            id="schemaPanel"
            defaultSize={schemaPanelSize}
            onResize={setSchemaPanelSize}
            className="relative hidden min-w-0 md:block"
          >
            <SchemaTreePanel />
            <EditOverlay />
          </ResizablePanel>
        </ResizablePanelGroup>

        <div className="md:hidden">
          <EditOverlay />
        </div>
      </div>
    </div>
  );
}

export default BrowseTab;
