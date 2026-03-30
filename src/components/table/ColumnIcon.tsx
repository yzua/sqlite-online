import {
  isDate,
  isNumber,
  isText,
  isBlob,
  isBoolean
} from "@/sqlite/sqlite-type-check";

import type { TableSchemaRow } from "@/types";

import {
  KeyRoundIcon,
  KeySquareIcon,
  CuboidIcon,
  CalendarIcon,
  TypeIcon,
  HashIcon,
  ToggleLeftIcon,
  HelpCircleIcon
} from "lucide-react";

interface ColumnIconProps {
  columnSchema: TableSchemaRow | null;
}

function ColumnIcon({ columnSchema }: Readonly<ColumnIconProps>) {
  if (!columnSchema) return null;

  const { type, isPrimaryKey, isForeignKey } = columnSchema;

  const getTypeIcon = () => {
    if (!type) return null;

    if (isBlob(type)) return <CuboidIcon className="h-4 w-4 text-green-500" />;
    if (isDate(type)) return <CalendarIcon className="h-4 w-4 text-blue-500" />;
    if (isText(type)) return <TypeIcon className="h-4 w-4 text-indigo-500" />;
    if (isNumber(type)) return <HashIcon className="h-4 w-4 text-red-500" />;
    if (isBoolean(type))
      return <ToggleLeftIcon className="h-4 w-4 text-pink-500" />;

    return <HelpCircleIcon className="h-4 w-4 text-gray-500" />;
  };

  const typeIcon = getTypeIcon();

  return (
    <div className="flex items-center gap-[2px]">
      {isPrimaryKey && <KeyRoundIcon className="h-4 w-4 text-yellow-500" />}
      {isForeignKey && <KeySquareIcon className="h-4 w-4 text-purple-500" />}
      {typeIcon}
    </div>
  );
}

export default ColumnIcon;
