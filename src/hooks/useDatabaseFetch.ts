import { useCallback, useEffect, useRef, useState } from "react";
import showToast from "@/components/common/toast";
import { useDatabaseStore } from "@/store/useDatabaseStore";

interface UseDatabaseFetchReturn {
  fetchError: string | null;
  showProxyDialog: boolean;
  dismissDialog: () => void;
  handleRetryWithProxy: () => void;
}

export function useDatabaseFetch(
  handleFileUpload: (file: File) => void
): UseDatabaseFetchReturn {
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

      setDatabaseLoading(true);

      const fetchUrl = useProxy
        ? `https://corsproxy.io/?url=${encodeURIComponent(url)}`
        : url;

      return fetch(fetchUrl, { method: "GET" })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          showToast(
            useProxy
              ? "Retrieving database with CORS proxy, please wait"
              : "Retrieving database, please wait",
            "info"
          );

          const blob = await response.blob();

          if (blob.size < 100) {
            throw new Error(
              "The downloaded file seems too small to be a valid SQLite database"
            );
          }

          handleFileUpload(new File([blob], "database.sqlite"));
          showToast("Database loaded successfully", "success");
          setFetchError(null);

          return true;
        })
        .catch((error: unknown) => {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          setFetchError(errorMsg);

          if (useProxy) {
            showToast(`Failed to load with CORS proxy: ${errorMsg}`, "error");
          } else {
            setUrlToFetch(url);
            setShowProxyDialog(true);
          }

          return false;
        })
        .then((result) => {
          setDatabaseLoading(false);
          fetchInProgress.current = false;
          return result;
        });
    },
    [handleFileUpload, isValidURL, setDatabaseLoading]
  );

  useEffect(() => {
    if (initialCheckDone.current) {
      return;
    }

    initialCheckDone.current = true;

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
  }, [fetchDatabase]);

  const dismissDialog = useCallback(() => {
    setShowProxyDialog(false);
    setFetchError(null);
  }, []);

  const handleRetryWithProxy = useCallback(() => {
    if (urlToFetch) {
      fetchDatabase(urlToFetch, true);
      setShowProxyDialog(false);
    }
  }, [urlToFetch, fetchDatabase]);

  return { fetchError, showProxyDialog, dismissDialog, handleRetryWithProxy };
}
