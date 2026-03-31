import { LoaderCircleIcon } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import SchemaTree from "@/components/structureTab/SchemaTree";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import usePanelManager from "@/hooks/usePanel";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { selectPanelSizes, usePanelStore } from "@/store/usePanelStore";
import ActionButtons from "./ActionButtons";
import BrowseTabEditOverlay from "./BrowseTabEditOverlay";
import DataTable from "./DataTable";
import PaginationControls from "./PaginationControls";
import TableSelector from "./TableSelector";

function BrowseDataTab() {
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const isDataLoading = useDatabaseStore((state) => state.isDataLoading);
  const isDatabaseLoading = useDatabaseStore(
    (state) => state.isDatabaseLoading
  );

  const { dataPanelSize, schemaPanelSize } = usePanelStore(
    useShallow(selectPanelSizes)
  );
  const setDataPanelSize = usePanelStore((state) => state.setDataPanelSize);
  const setSchemaPanelSize = usePanelStore((state) => state.setSchemaPanelSize);

  const { isEditing } = usePanelManager();

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex flex-wrap items-center gap-1 border-b px-1 py-2"
        role="toolbar"
        aria-label="Table controls and actions"
      >
        <TableSelector />
        <ActionButtons filters={filters} sorters={sorters} />
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
          >
            <div
              className="flex h-full flex-col justify-between border-l"
              id="dataSection"
            >
              <DataTable />
              <PaginationControls />
            </div>
          </ResizablePanel>

          <div className="hidden md:contents">
            <ResizableHandle withHandle />

            <ResizablePanel
              id="schemaPanel"
              defaultSize={schemaPanelSize}
              onResize={setSchemaPanelSize}
              className="relative"
            >
              <div className="h-full overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <SchemaTree />
                </div>
              </div>
              <BrowseTabEditOverlay isEditing={isEditing} />
            </ResizablePanel>
          </div>
        </ResizablePanelGroup>

        <div className="md:hidden">
          <BrowseTabEditOverlay isEditing={isEditing} />
        </div>
      </div>
    </div>
  );
}

export default BrowseDataTab;
