import { useCallback, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import SchemaTreePanel from "@/components/structure-tab/SchemaTreePanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { useGeminiAI } from "@/hooks/useGeminiAI";
import { usePanelSizing } from "@/hooks/usePanelSizing";
import useDatabaseWorker from "@/hooks/useWorker";
import {
  selectExecuteViewState,
  useDatabaseStore
} from "@/store/useDatabaseStore";
import ApiKeyModal from "./ApiKeyModal";
import ExecuteTabEditorPanel from "./ExecuteTabEditorPanel";
import ExecuteTabToolbar from "./ExecuteTabToolbar";

function ExecuteTab() {
  const {
    errorMessage,
    isDataLoading,
    isDatabaseLoading,
    customQuery,
    customQueryObject
  } = useDatabaseStore(useShallow(selectExecuteViewState));
  const setErrorMessage = useDatabaseStore((state) => state.setErrorMessage);

  const {
    dataPanelSize,
    schemaPanelSize,
    setDataPanelSize,
    setSchemaPanelSize
  } = usePanelSizing();
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const { handleQueryExecute, handleExport } = useDatabaseWorker();
  const { generateSqlQuery, isAiLoading } = useGeminiAI();

  const handleExecuteClick = () => {
    if (customQuery.startsWith("/ai ")) {
      generateSqlQuery();
    } else {
      handleQueryExecute();
    }
  };

  const handleErrorClose = useCallback(() => {
    setErrorMessage(null);
  }, [setErrorMessage]);

  const handleApiKeyModalOpen = () => {
    setIsApiKeyModalOpen(true);
  };

  return (
    <div className="flex h-full flex-col">
      <ExecuteTabToolbar
        isAiLoading={isAiLoading}
        isDataLoading={isDataLoading}
        isDatabaseLoading={isDatabaseLoading}
        canExport={Boolean(customQueryObject?.data)}
        onExecute={handleExecuteClick}
        onExport={() => handleExport("custom")}
        onOpenGemini={handleApiKeyModalOpen}
      />

      <div className="h-full overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel
            defaultSize={dataPanelSize}
            onResize={setDataPanelSize}
          >
            <ExecuteTabEditorPanel
              errorMessage={errorMessage}
              onDismissError={handleErrorClose}
            />
          </ResizablePanel>

          <ResizableHandle className="hidden md:flex" withHandle />

          <ResizablePanel
            defaultSize={schemaPanelSize}
            onResize={setSchemaPanelSize}
            className="hidden md:block"
          >
            <SchemaTreePanel />
          </ResizablePanel>
        </ResizablePanelGroup>
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          onClose={() => setIsApiKeyModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default ExecuteTab;
