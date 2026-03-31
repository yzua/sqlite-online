import {
  CodeIcon,
  DatabaseIcon,
  LoaderCircleIcon,
  TableIcon
} from "lucide-react";
import { lazy, Suspense } from "react";
import LiveRegion from "@/components/accessibility/LiveRegion";
import SkipLinks from "@/components/accessibility/SkipLinks";
import BrowseTab from "@/components/browseTab/BrowseTab";
import FileDropHandler from "@/components/FileDropHandler";
import StructureTab from "@/components/structureTab/StructureTab";
import TopBar from "@/components/TopBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatabaseURLLoader from "./components/DatabaseURLLoader";
import { useDatabaseStore } from "./store/useDatabaseStore";

const ExecuteTab = lazy(() => import("@/components/executeTab/ExecuteTab"));

function PanelLoadingState() {
  return (
    <div className="flex h-full items-center justify-center px-4">
      <span className="text-muted-foreground flex items-center gap-2 text-sm">
        <LoaderCircleIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
        Loading panel
      </span>
    </div>
  );
}

function App() {
  const isDatabaseLoading = useDatabaseStore(
    (state) => state.isDatabaseLoading
  );

  return (
    <>
      <SkipLinks />
      <DatabaseURLLoader />
      <FileDropHandler>
        <main
          className="bg-primary/5 flex h-screen flex-col overflow-hidden"
          id="main-content"
        >
          <TopBar />
          <Tabs defaultValue="data" className="flex flex-1 flex-col">
            <TabsList
              className="bg-primary/5 h-auto min-h-11 w-full justify-start rounded-none border-b"
              role="tablist"
              aria-label="Database interface navigation"
            >
              <TabsTrigger
                id="data"
                key="data"
                disabled={isDatabaseLoading}
                value="data"
                className="data-[state=active]:border-primary min-h-11 rounded-none text-xs"
                aria-label="Browse and filter database table data"
                aria-describedby={
                  isDatabaseLoading ? "loading-status" : undefined
                }
              >
                <TableIcon
                  className="hidden h-4 w-4 md:block"
                  aria-hidden="true"
                />
                <span>Browse Data</span>
              </TabsTrigger>
              <TabsTrigger
                disabled={isDatabaseLoading}
                id="execute"
                key="execute"
                value="execute"
                className="data-[state=active]:border-primary min-h-11 rounded-none text-xs"
                aria-label="Execute custom SQL queries"
                aria-describedby={
                  isDatabaseLoading ? "loading-status" : undefined
                }
              >
                <CodeIcon
                  className="hidden h-4 w-4 md:block"
                  aria-hidden="true"
                />
                Execute SQL
              </TabsTrigger>
              <TabsTrigger
                id="structure"
                key="structure"
                disabled={isDatabaseLoading}
                value="structure"
                className="data-[state=active]:border-primary min-h-11 rounded-none text-xs"
                aria-label="View database schema and table structure"
                aria-describedby={
                  isDatabaseLoading ? "loading-status" : undefined
                }
              >
                <DatabaseIcon
                  className="hidden h-4 w-4 md:block"
                  aria-hidden="true"
                />
                Database Structure
              </TabsTrigger>
            </TabsList>

            <section className="max-h-custom-dvh flex-1 overflow-hidden">
              <TabsContent
                value="data"
                className="m-0 h-full border-none p-0"
                role="tabpanel"
                aria-labelledby="data"
              >
                {isDatabaseLoading ? (
                  <div
                    className="flex h-full flex-col items-center justify-center gap-4"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="bg-primary/10 rounded-full p-4">
                      <LoaderCircleIcon
                        className="text-primary h-8 w-8 animate-spin"
                        aria-hidden="true"
                      />
                    </div>
                    <div
                      className="flex flex-col items-center"
                      id="loading-status"
                    >
                      <span className="text-xl font-medium">
                        Loading Database
                      </span>
                      <span className="text-muted-foreground text-sm">
                        Please wait while the database is initializing
                      </span>
                    </div>
                  </div>
                ) : (
                  <BrowseTab />
                )}
              </TabsContent>
              <TabsContent
                value="structure"
                className="m-0 h-full border-none p-0"
                role="tabpanel"
                aria-labelledby="structure"
              >
                <StructureTab />
              </TabsContent>
              <TabsContent
                value="execute"
                className="m-0 h-full border border-none p-0"
                role="tabpanel"
                aria-labelledby="execute"
              >
                <Suspense fallback={<PanelLoadingState />}>
                  <ExecuteTab />
                </Suspense>
              </TabsContent>
            </section>
          </Tabs>
        </main>
        <LiveRegion />
      </FileDropHandler>
    </>
  );
}

export default App;
