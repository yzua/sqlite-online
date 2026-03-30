import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import AppToaster from "@/components/common/Toaster/Toaster";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import ThemeProvider from "@/providers/theme/ThemeProvider.tsx";
import DatabaseWorkerProvider from "@/providers/worker/WorkerProvider.tsx";
import PanelProvider from "@/providers/panel/PanelProvider";
import { useDatabaseStore } from "@/store/useDatabaseStore";

import App from "./App.tsx";

// Initialize secure API key storage
const initializeApp = async () => {
  try {
    const { initializeApiKey } = useDatabaseStore.getState();
    await initializeApiKey();
  } catch (error) {
    console.error("App: Failed to initialize API key:", error);
  }
};

// Initialize the app
initializeApp();

createRoot(document.getElementById("root") as HTMLElement).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
        <PanelProvider>
          <DatabaseWorkerProvider>
            <App />
          </DatabaseWorkerProvider>
        </PanelProvider>
        <AppToaster />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
