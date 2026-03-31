import { ChevronLeftIcon, PlusIcon, SquarePenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Span } from "@/components/ui/span";

interface EditSectionHeaderProps {
  isInserting: boolean;
  onBack: () => void;
}

function EditSectionHeader({ isInserting, onBack }: EditSectionHeaderProps) {
  return (
    <div className="bg-primary/5 sticky top-0 z-10 flex w-full items-center justify-between gap-1 border-b p-2 shadow-sm">
      <div className="flex items-center gap-2">
        {isInserting ? (
          <>
            <div className="bg-primary/10 rounded p-1.5">
              <PlusIcon className="h-4 w-4" />
            </div>
            <Span className="text-sm font-medium whitespace-nowrap">
              Inserting new row
            </Span>
          </>
        ) : (
          <>
            <div className="bg-primary/10 rounded p-1.5">
              <SquarePenIcon className="h-4 w-4" />
            </div>
            <Span className="text-sm font-medium whitespace-nowrap">
              Updating row
            </Span>
          </>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="text-xs"
        onClick={onBack}
        title="Go back to data"
        aria-label="Go back to data"
      >
        <ChevronLeftIcon className="mr-1 h-3 w-3" />
        Back
      </Button>
    </div>
  );
}

export default EditSectionHeader;
