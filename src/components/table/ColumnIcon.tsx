import {
  CalendarIcon,
  CuboidIcon,
  HashIcon,
  HelpCircleIcon,
  KeyRoundIcon,
  KeySquareIcon,
  ToggleLeftIcon,
  TypeIcon
} from "lucide-react";
import {
  isBlob,
  isBoolean,
  isDate,
  isNumber,
  isText
} from "@/sqlite/sqlite-type-check";
import type { TableSchemaRow } from "@/types";

interface ColumnIconProps {
  columnSchema: TableSchemaRow | null;
}

function ColumnIcon({ columnSchema }: Readonly<ColumnIconProps>) {
  if (!columnSchema) return null;

  const { type, isPrimaryKey, isForeignKey } = columnSchema;

  const getTypeIcon = () => {
    if (!type) return null;

    if (isBlob(type)) return <CuboidIcon className="text-success h-4 w-4" />;
    if (isDate(type)) return <CalendarIcon className="text-info h-4 w-4" />;
    if (isText(type)) return <TypeIcon className="text-primary h-4 w-4" />;
    if (isNumber(type))
      return <HashIcon className="text-destructive h-4 w-4" />;
    if (isBoolean(type))
      return <ToggleLeftIcon className="text-warning h-4 w-4" />;

    return <HelpCircleIcon className="text-muted-foreground h-4 w-4" />;
  };

  const typeIcon = getTypeIcon();

  return (
    <div className="flex items-center gap-[2px]">
      {isPrimaryKey && <KeyRoundIcon className="text-warning h-4 w-4" />}
      {isForeignKey && <KeySquareIcon className="text-info h-4 w-4" />}
      {typeIcon}
    </div>
  );
}

export default ColumnIcon;
