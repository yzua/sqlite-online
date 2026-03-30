import { useEffect, useState, useCallback, useRef } from "react";
import useDatabaseWorker from "@/hooks/useWorker";
import { useDatabaseStore } from "@/store/useDatabaseStore";

import showToast from "@/components/common/Toaster/Toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "./ui/button";

function DatabaseURLLoader() {
  const { handleFileUpload } = useDatabaseWorker();
  const setDatabaseLoading = useDatabaseStore(
    (state) => state.setIsDatabaseLoading
  );

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [urlToFetch, setUrlToFetch] = useState<string | null>(null);
  const [showProxyDialog, setShowProxyDialog] = useState(false);

  const initialCheckDone = useRef(false);
  const fetchInProgress = useRef(false);

  const isValidURL = useCallback((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchDatabase = useCallback(
    async (url: string, useProxy = false) => {
      if (fetchInProgress.current) {
        console.log("Fetch already in progress, ignoring duplicate call");
        return false;
      }

      fetchInProgress.current = true;

      if (!isValidURL(url)) {
        const message = "Invalid URL format";
        setFetchError(message);
        showToast(message, "error");
        fetchInProgress.current = false;
        return false;
      }

      try {
        setDatabaseLoading(true);

        const fetchUrl = useProxy
          ? `https://corsproxy.io/?url=${encodeURIComponent(url)}`
          : url;

        const response = await fetch(fetchUrl, {
          method: "GET"
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!useProxy) {
          showToast("Retrieving database, please wait", "info");
        } else {
          showToast("Retrieving database with CORS proxy, please wait", "info");
        }

        const blob = await response.blob();

        if (blob.size < 100) {
          throw new Error(
            "The downloaded file seems too small to be a valid SQLite database"
          );
        }

        const file = new File([blob], "database.sqlite");

        handleFileUpload(file);

        showToast("Database loaded successfully", "success");

        setFetchError(null);
        return true;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setFetchError(errorMsg);

        if (useProxy) {
          showToast(`Failed to load with CORS proxy: ${errorMsg}`, "error");
        } else {
          // First attempt failed, show dialog
          setUrlToFetch(url);
          setShowProxyDialog(true);
        }

        return false;
      } finally {
        setDatabaseLoading(false);
        fetchInProgress.current = false;
      }
    },
    [handleFileUpload, setDatabaseLoading]
  );

  useEffect(() => {
    if (initialCheckDone.current) {
      return;
    }

    initialCheckDone.current = true;
    const abortController = new AbortController();

    const checkURLParam = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const url = urlParams.get("url");

      if (url) {
        const decodedUrl = decodeURIComponent(url);
        try {
          await fetchDatabase(decodedUrl);
        } catch (error) {
          console.error("Initial fetch error:", error);
        }
      }
    };

    checkURLParam();

    return () => {
      abortController.abort();
    };
  }, [fetchDatabase]);

  const handleRetryWithProxy = useCallback(() => {
    if (urlToFetch) {
      fetchDatabase(urlToFetch, true);
      setShowProxyDialog(false);
    }
  }, [urlToFetch, fetchDatabase]);

  return (
    <Dialog open={showProxyDialog} onOpenChange={setShowProxyDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            CORS Error Detected
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-sm">
            Something went wrong while loading the database. This might be due
            to Cross-Origin Resource Sharing (CORS) restrictions.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <p className="text-sm">
            Would you like to try using a CORS proxy?{" "}
            <span className="font-medium text-yellow-500 dark:text-yellow-400">
              Note that this will send your database request through a
              third-party service.
            </span>
          </p>

          {fetchError && (
            <div className="bg-destructive/10 dark:bg-destructive/20 rounded-md p-3 text-red-400">
              <p className="text-xs">Error details: {fetchError}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setShowProxyDialog(false);
              setFetchError(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="default" onClick={handleRetryWithProxy}>
            Use CORS Proxy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DatabaseURLLoader;
