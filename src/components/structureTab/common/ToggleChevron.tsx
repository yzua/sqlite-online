import { memo } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";

const MemoizedChevronDownIcon = memo(ChevronDownIcon);
const MemoizedChevronRightIcon = memo(ChevronRightIcon);

interface ToggleChevronProps {
  expanded: boolean;
  size?: number;
}

const ToggleChevron = memo(({ expanded, size = 4 }: ToggleChevronProps) => {
  const className = `h-${size} w-${size}`;

  if (expanded) {
    return <MemoizedChevronDownIcon className={className} />;
  }

  return <MemoizedChevronRightIcon className={className} />;
});

export default ToggleChevron;
