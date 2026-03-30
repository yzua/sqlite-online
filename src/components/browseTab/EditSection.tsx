import { useCallback, useEffect, useMemo } from "react";
import useDatabaseWorker from "@/hooks/useWorker";
import usePanelManager from "@/hooks/usePanel";
import { useDatabaseStore } from "@/store/useDatabaseStore";
import { usePanelStore } from "@/store/usePanelStore";

import { isDate, isNumber, isText } from "@/sqlite/sqlite-type-check";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Span } from "@/components/ui/span";
import ColumnIcon from "@/components/table/ColumnIcon";
import { Textarea } from "../ui/textarea";

import {
  ChevronLeftIcon,
  PlusIcon,
  SquarePenIcon,
  Trash2Icon
} from "lucide-react";

function EditSection() {
  const { handleEditSubmit } = useDatabaseWorker();
  const { selectedRowObject, isInserting, handleCloseEdit } = usePanelManager();
  const editValues = usePanelStore((state) => state.editValues);
  const setEditValues = usePanelStore((state) => state.setEditValues);
  const tablesSchema = useDatabaseStore((state) => state.tablesSchema);
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const columns = useDatabaseStore((state) => state.columns);

  useEffect(() => {
    if (isInserting) {
      setEditValues(columns?.map(() => "") || []);
    } else if (selectedRowObject) {
      setEditValues(
        selectedRowObject.data.map((value) => value?.toString() ?? "")
      );
    }
  }, [isInserting, selectedRowObject, columns, setEditValues]);

  const handleEditInputChange = useCallback(
    (index: number, newValue: string) => {
      const currentEditValues = usePanelStore.getState().editValues;
      setEditValues(
        currentEditValues.map((value, i) => (i === index ? newValue : value))
      );
    },
    [setEditValues]
  );

  const formItems = useMemo(() => {
    if (!columns || !currentTable || !tablesSchema[currentTable]) return null;

    const schema = tablesSchema[currentTable]?.schema;

    return columns.map((column, index) => {
      const columnSchema = schema[index];
      const placeholder = columnSchema?.dflt_value || "Null";
      const inputType = (() => {
        const typeValue = columnSchema?.type ?? "";
        if (isNumber(typeValue)) return "number";
        if (isDate(typeValue)) return "date";
        return "text";
      })();

      return (
        <div key={column} className="border-primary/10 border shadow-sm">
          <label
            htmlFor={column}
            className="bg-primary/5 border-primary/10 flex items-center gap-1 border-b p-1.5"
          >
            <div className="flex w-full items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ColumnIcon columnSchema={columnSchema} />
                <Span className="text-xs font-medium capitalize">{column}</Span>
              </div>
              {columnSchema.IsNullable && (
                <span className="text-primary/50 bg-primary/5 rounded-full px-2 py-0.5 text-xs">
                  Nullable
                </span>
              )}
            </div>
          </label>
          <div className="p-1">
            {isText(columnSchema?.type ?? "") ? (
              <Textarea
                id={column}
                name={column}
                className="border-primary/20 focus:ring-primary/30 focus:border-primary/40 rounded border text-sm text-[0.8rem]! focus:ring-1"
                value={editValues[index] || ""}
                onChange={(e) => handleEditInputChange(index, e.target.value)}
                placeholder={placeholder}
              />
            ) : (
              <Input
                id={column}
                name={column}
                type={inputType}
                className="border-primary/20 focus:ring-primary/30 focus:border-primary/40 h-9 rounded border text-[0.8rem]! focus:ring-1"
                value={editValues[index] || ""}
                onChange={(e) => handleEditInputChange(index, e.target.value)}
                placeholder={placeholder}
              />
            )}
          </div>
        </div>
      );
    });
  }, [columns, currentTable, tablesSchema, editValues, handleEditInputChange]);

  const actionButtons = useMemo(
    () => (
      <div className="bg-primary/5 border-primary/10 flex w-full gap-1 border-t p-2 shadow-inner">
        <Button
          size="sm"
          variant="outline"
          className="w-full py-2 text-xs font-medium"
          onClick={() => handleEditSubmit(isInserting ? "insert" : "update")}
          aria-label={isInserting ? "Insert row" : "Apply changes"}
          disabled={tablesSchema[currentTable!]?.type === "view"}
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
            onClick={() => handleEditSubmit("delete")}
            aria-label="Delete row"
            disabled={tablesSchema[currentTable!]?.type === "view"}
          >
            <Trash2Icon className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    ),
    [handleEditSubmit, isInserting, currentTable, tablesSchema]
  );

  const sectionHeader = useMemo(
    () => (
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
          onClick={handleCloseEdit}
          title="Go back to data"
          aria-label="Go back to data"
        >
          <ChevronLeftIcon className="mr-1 h-3 w-3" />
          Back
        </Button>
      </div>
    ),
    [isInserting, handleCloseEdit]
  );

  return (
    <section className="flex h-full flex-col">
      {sectionHeader}
      <div className="flex-1 overflow-auto">{formItems}</div>
      {actionButtons}
    </section>
  );
}

export default EditSection;
