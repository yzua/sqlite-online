import { useCallback, useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { debounce } from "lodash";

interface FilterInputProps {
  column: string;
  value: string;
  onChange: (column: string, value: string) => void;
  debounceTime?: number;
}

function FilterInput({
  column,
  value,
  onChange,
  debounceTime = 300
}: Readonly<FilterInputProps>) {
  const [inputValue, setInputValue] = useState(value);

  // Update the local value when the prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const debouncedOnChange = useMemo(() => {
    const handler = debounce((col: string, val: string) => {
      onChange(col, val);
    }, debounceTime);

    return handler;
  }, [debounceTime]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      debouncedOnChange(column, newValue);
    },
    [column, debouncedOnChange]
  );

  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  const filterId = `filter-${column}`;
  const labelId = `filter-label-${column}`;

  return (
    <div className="relative">
      <label htmlFor={filterId} id={labelId} className="sr-only">
        Filter {column} column
      </label>
      <Input
        id={filterId}
        type="text"
        className="border-primary/20 max-h-6 w-full rounded px-2 py-1 text-[0.8rem]!"
        value={inputValue}
        onChange={handleChange}
        placeholder="Filter"
        aria-labelledby={labelId}
        aria-describedby={`${filterId}-description`}
        title={`Filter rows by ${column} column values`}
      />
      <span id={`${filterId}-description`} className="sr-only">
        Type to filter table rows by {column} column values. Results update
        automatically as you type.
      </span>
    </div>
  );
}

export default FilterInput;
