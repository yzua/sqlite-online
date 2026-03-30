import { memo } from "react";

import { cn } from "@/lib/utils";

import { Span } from "@/components/ui/span";
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
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onToggle();
      }
    };

    return (
      <header
        className={cn(
          "hover:bg-primary/5 bg-primary/7 flex cursor-pointer items-center px-2 py-2 transition-colors",
          !expanded && "mb-0"
        )}
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={expanded}
      >
        <div className="flex h-5 w-5 items-center justify-center">
          <ToggleChevron expanded={expanded} size={5} />
        </div>
        {icon}
        <Span className="flex items-center gap-1">{title}</Span>
        {children}
      </header>
    );
  }
);

export default SectionHeader;
