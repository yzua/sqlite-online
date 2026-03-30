import { useDatabaseStore } from "@/store/useDatabaseStore";
import { usePanelStore } from "@/store/usePanelStore";
import usePanelManager from "@/hooks/usePanel";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import SchemaTree from "@/components/structureTab/SchemaTree";
import TableSelector from "./TableSelector";
import EditSection from "./EditSection";
import DataTable from "./DataTable";
import PaginationControls from "./PaginationControls";
import ActionButtons from "./ActionButtons";

import { LoaderCircleIcon } from "lucide-react";

function BrowseDataTab() {
  const filters = useDatabaseStore((state) => state.filters);
  const sorters = useDatabaseStore((state) => state.sorters);
  const isDataLoading = useDatabaseStore((state) => state.isDataLoading);
  const isDatabaseLoading = useDatabaseStore(
    (state) => state.isDatabaseLoading
  );

  const dataPanelSize = usePanelStore((state) => state.dataPanelSize);
  const schemaPanelSize = usePanelStore((state) => state.schemaPanelSize);
  const setDataPanelSize = usePanelStore((state) => state.setDataPanelSize);
  const setSchemaPanelSize = usePanelStore((state) => state.setSchemaPanelSize);

  const { isEditing } = usePanelManager();

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center gap-1 border-b px-1 py-2"
        role="toolbar"
        aria-label="Table controls and actions"
      >
        <TableSelector />
        <ActionButtons filters={filters} sorters={sorters} />
        {(isDataLoading || isDatabaseLoading) && (
          <span
            className="ml-2 flex items-center text-xs text-gray-500"
            role="status"
            aria-live="polite"
            aria-label="Loading table data"
          >
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
          {/* Left Panel - Data Table */}
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

          <ResizableHandle className="hidden md:flex" withHandle />

          <ResizablePanel
            id="schemaPanel"
            defaultSize={schemaPanelSize}
            onResize={setSchemaPanelSize}
            className={`static md:relative md:block ${isEditing ? "block" : "hidden"}`}
          >
            <div className="h-full overflow-hidden">
              <div className="h-full overflow-y-auto">
                <SchemaTree />
              </div>
            </div>
            {/* TODO: Move this to a separate component as an edit section */}
            <div
              className={`bg-background absolute top-0 right-0 z-40 h-full w-full ${isEditing ? "block" : "hidden"}`}
            >
              <section className="bg-primary/5 h-full">
                <EditSection />
              </section>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default BrowseDataTab;
