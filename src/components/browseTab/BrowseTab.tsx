import { LoaderCircleIcon } from "lucide-react";
import SchemaTreePanel from "@/components/structureTab/SchemaTreePanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import usePanelManager from "@/hooks/usePanel";
import { usePanelSizing } from "@/hooks/usePanelSizing";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import ActionButtons from "./ActionButtons";
import DataTable from "./DataTable";
import EditSection from "./EditSection";
import PaginationControls from "./PaginationControls";
import TableSelector from "./TableSelector";

function BrowseTab() {
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
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
              className="flex h-full min-h-0 flex-col border-l"
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
              <SchemaTreePanel />
              <div
                className={`bg-background absolute inset-0 z-40 ${isEditing ? "block" : "hidden"}`}
              >
                <section className="bg-primary/5 h-full">
                  <EditSection />
                </section>
              </div>
            </ResizablePanel>
          </div>
        </ResizablePanelGroup>

        <div className="md:hidden">
          <div
            className={`bg-background absolute inset-0 z-40 ${isEditing ? "block" : "hidden"}`}
          >
            <section className="bg-primary/5 h-full">
              <EditSection />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrowseTab;
