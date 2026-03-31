import { PlusIcon, SquarePenIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditSectionActionsProps {
  isInserting: boolean;
  isView: boolean;
  onInsertOrUpdate: () => void;
  onDelete: () => void;
}

function EditSectionActions({
  isInserting,
  isView,
  onInsertOrUpdate,
  onDelete
}: EditSectionActionsProps) {
  return (
    <div className="bg-primary/5 border-primary/10 flex w-full gap-1 border-t p-2 shadow-inner">
      <Button
        size="sm"
        variant="outline"
        className="w-full py-2 text-xs font-medium"
        onClick={onInsertOrUpdate}
        aria-label={isInserting ? "Insert row" : "Apply changes"}
        disabled={isView}
      >
        {isInserting ? (
          <>
            <PlusIcon className="mr-2 h-3.5 w-3.5" />
            Insert row
          </>
        ) : (
          <>
            <SquarePenIcon className="mr-2 h-3.5 w-3.5" />
            Apply changes
          </>
        )}
      </Button>
      {!isInserting && (
        <Button
          size="sm"
          variant="destructive"
          className="hover:bg-destructive/50 rounded text-xs"
          onClick={onDelete}
          aria-label="Delete row"
          disabled={isView}
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

export default EditSectionActions;
