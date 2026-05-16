import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useDatabaseFetch } from "@/hooks/useDatabaseFetch";
import useDatabaseWorker from "@/hooks/useWorker";

function DatabaseURLLoader() {
  const { handleFileUpload } = useDatabaseWorker();
  const { fetchError, showProxyDialog, dismissDialog, handleRetryWithProxy } =
    useDatabaseFetch(handleFileUpload);

  return (
    <Dialog
      open={showProxyDialog}
      onOpenChange={(open) => !open && dismissDialog()}
    >
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
            <span className="text-warning font-medium">
              Note that this will send your database request through a
              third-party service.
            </span>
          </p>

          {fetchError && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3">
              <p className="text-xs">Error details: {fetchError}</p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={dismissDialog}>
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
