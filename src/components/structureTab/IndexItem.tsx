import { memo } from "react";

import type { IndexSchema } from "@/types";

import { Span } from "@/components/ui/span";

interface IndexItemProps {
  index: IndexSchema;
}

const IndexItem = memo(({ index }: IndexItemProps) => {
  return (
    <article>
      <div className="flex cursor-pointer items-center rounded px-1.5 py-1 transition-all hover:ml-2">
        <div className="flex w-full items-center justify-between gap-1">
          <span className="text-sm">{index.name}</span>
          <Span className="text-primary/60 text-xs font-medium whitespace-nowrap">
            <span className="text-primary/50 bg-primary/5 rounded-full px-2 py-0.5 text-xs">
              {index.tableName}
            </span>
          </Span>
        </div>
      </div>
    </article>
  );
});

export default IndexItem;
