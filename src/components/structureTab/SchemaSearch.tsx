import { SearchIcon } from "lucide-react";
import { memo } from "react";
import { Input } from "@/components/ui/input";

interface SchemaSearchProps {
  onFilterChange: (value: string) => void;
}

const SchemaSearch = memo(({ onFilterChange }: SchemaSearchProps) => {
  return (
    <div className="relative">
      <SearchIcon className="text-primary/40 absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2 transform" />
      <Input
        placeholder="Search tables and indexes"
        className="border-primary/20 h-11 w-full pl-8 text-sm text-[0.8rem]!"
        onChange={(e) => onFilterChange(e.target.value)}
        aria-label="Search tables and indexes"
      />
    </div>
  );
});

export default SchemaSearch;
