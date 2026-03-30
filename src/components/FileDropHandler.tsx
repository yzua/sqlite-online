import { DatabaseIcon } from "lucide-react";
import useFileDrop from "@/hooks/useFileDrop";

interface FileDropHandlerProps {
  children: React.ReactNode;
}

function FileDropHandler({ children }: Readonly<FileDropHandlerProps>) {
  const { isDragging } = useFileDrop();

  return (
    <>
      {children}
      {isDragging && (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
          <div className="border-primary/60 bg-background/95 animate-in fade-in zoom-in-95 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 shadow-lg transition-transform duration-200">
            <div className="bg-primary/10 mb-6 flex items-center justify-center rounded-full p-5">
              <DatabaseIcon className="text-primary h-12 w-12" />
            </div>

            <h3 className="mb-2 text-xl font-medium">Drop SQLite Database</h3>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              Release to load your database file
            </p>
          </div>
        </section>
      )}
    </>
  );
}

export default FileDropHandler;
