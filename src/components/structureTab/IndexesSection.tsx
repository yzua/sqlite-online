import { memo } from "react";

import type { IndexSchema } from "@/types";

import IndexItem from "./IndexItem";
import SectionHeader from "./common/SectionHeader";

import { TagIcon } from "lucide-react";

interface IndexesSectionProps {
  indexes: IndexSchema[];
  expandedIndexSection: boolean;
  toggleIndexSection: () => void;
}

const IndexesSection = memo(
  ({
    indexes,
    expandedIndexSection,
    toggleIndexSection
  }: IndexesSectionProps) => {
    return (
      <section>
        <SectionHeader
          title="Indexes"
          expanded={expandedIndexSection}
          icon={<TagIcon className="mr-2 h-4 w-4" />}
          onToggle={toggleIndexSection}
        />

        {expandedIndexSection && (
          <div className="space-y-0.5 overflow-y-auto pr-1 pl-2">
            {indexes.map((index) => (
              <IndexItem key={index.name} index={index} />
            ))}
          </div>
        )}
      </section>
    );
  }
);

export default IndexesSection;
