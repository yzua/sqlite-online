import { memo } from "react";
import { Span } from "@/components/ui/span";
import { cn } from "@/lib/utils";
import ToggleChevron from "./ToggleChevron";

interface SectionHeaderProps {
  title: string;
  expanded: boolean;
  icon: React.ReactNode;
  onToggle: () => void;
  children?: React.ReactNode;
}

const SectionHeader = memo(
  ({ title, expanded, icon, onToggle, children }: SectionHeaderProps) => {
    return (
      <div
        className={cn(
          "bg-primary/7 flex items-center px-2 py-2 transition-colors",
          !expanded && "mb-0"
        )}
      >
        <button
          type="button"
          className="hover:bg-primary/5 flex min-w-0 flex-1 cursor-pointer items-center rounded px-0 transition-colors"
          onClick={onToggle}
          aria-expanded={expanded}
        >
          <div className="flex h-5 w-5 items-center justify-center">
            <ToggleChevron expanded={expanded} size={5} />
          </div>
          {icon}
          <Span className="flex items-center gap-1">{title}</Span>
        </button>
        {children ? <div className="ml-auto flex">{children}</div> : null}
      </div>
    );
  }
);

export default SectionHeader;
