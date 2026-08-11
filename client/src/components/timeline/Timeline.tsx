import { Clock3 } from "lucide-react";

import type { TimelineItem as TimelineItemType } from "../../types/timeline";
import TimelineItem from "./TimelineItem";

type Props = {
  items: TimelineItemType[];
};

const Timeline = ({ items }: Props) => {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <Clock3 className="h-6 w-6 text-slate-500" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-slate-800">
          No timeline activity found
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
          There are no activities matching the selected
          filters.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute bottom-5 left-5 top-5 w-px bg-slate-200" />

      <div className="relative space-y-5">
        {items.map((item) => (
          <TimelineItem
            key={item.id}
            item={item}
          />
        ))}
      </div>
    </div>
  );
};

export default Timeline;
