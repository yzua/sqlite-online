import ColumnIcon from "@/components/table/ColumnIcon";
import { Input } from "@/components/ui/input";
import { Span } from "@/components/ui/span";
import { Textarea } from "@/components/ui/textarea";
import { isDate, isNumber, isText } from "@/sqlite/sqlite-type-check";
import type { TableSchemaRow } from "@/types";

interface EditSectionFieldProps {
  column: string;
  columnSchema: TableSchemaRow | null;
  value: string;
  onChange: (value: string) => void;
}

function EditSectionField({
  column,
  columnSchema,
  value,
  onChange
}: EditSectionFieldProps) {
  const placeholder = columnSchema?.dflt_value || "Null";
  const inputType = (() => {
    const typeValue = columnSchema?.type ?? "";
    if (isNumber(typeValue)) return "number";
    if (isDate(typeValue)) return "date";
    return "text";
  })();

  return (
    <div className="border-primary/10 border shadow-sm">
      <label
        htmlFor={column}
        className="bg-primary/5 border-primary/10 flex items-center gap-1 border-b p-1.5"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ColumnIcon columnSchema={columnSchema} />
            <Span className="text-xs font-medium capitalize">{column}</Span>
          </div>
          {columnSchema?.isNullable && (
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
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <Input
            id={column}
            name={column}
            type={inputType}
            className="border-primary/20 focus:ring-primary/30 focus:border-primary/40 h-9 rounded border text-[0.8rem]! focus:ring-1"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
          />
        )}
      </div>
    </div>
  );
}

export default EditSectionField;
