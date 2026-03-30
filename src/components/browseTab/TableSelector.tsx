import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Span } from "@/components/ui/span";
import useDatabaseWorker from "@/hooks/useWorker";
import { useDatabaseStore } from "@/store/useDatabaseStore";

function TableSelector() {
  const { handleTableChange } = useDatabaseWorker();
  const tablesSchema = useDatabaseStore((state) => state.tablesSchema);
  const currentTable = useDatabaseStore((state) => state.currentTable);
  const selectValue = currentTable ? { value: currentTable } : {};

  return (
    <Select onValueChange={handleTableChange} {...selectValue}>
      <SelectTrigger className="border-primary/20 h-8 w-30 border text-sm sm:w-48">
        <SelectValue placeholder="Select Table" />
      </SelectTrigger>
      <SelectContent>
        {Object.keys(tablesSchema).map((table) => (
          <SelectItem key={table} value={table}>
            <Span className="text-[0.8rem]! capitalize">{table}</Span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TableSelector;
