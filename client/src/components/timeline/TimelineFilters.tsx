import { RotateCcw, Search } from "lucide-react";

import type { TimelineFilters as TimelineFiltersType } from "../../types/timeline";

type Props = {
  filters: TimelineFiltersType;
  modules: string[];
  actions: string[];
  onChange: (
    key: keyof TimelineFiltersType,
    value: string,
  ) => void;
  onReset: () => void;
};

const TimelineFilters = ({
  filters,
  modules,
  actions,
  onChange,
  onReset,
}: Props) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <label
            htmlFor="timeline-search"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Search
          </label>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              id="timeline-search"
              type="search"
              value={filters.search}
              onChange={(event) =>
                onChange("search", event.target.value)
              }
              placeholder="Search activities..."
              className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="timeline-module"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Module
          </label>

          <select
            id="timeline-module"
            value={filters.module}
            onChange={(event) =>
              onChange("module", event.target.value)
            }
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Modules</option>

            {modules.map((module) => (
              <option key={module} value={module}>
                {module
                  .toLowerCase()
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (character) =>
                    character.toUpperCase(),
                  )}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="timeline-action"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Action
          </label>

          <select
            id="timeline-action"
            value={filters.action}
            onChange={(event) =>
              onChange("action", event.target.value)
            }
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">All Actions</option>

            {actions.map((action) => (
              <option key={action} value={action}>
                {action
                  .toLowerCase()
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (character) =>
                    character.toUpperCase(),
                  )}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Filters
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="timeline-date-from"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            From
          </label>

          <input
            id="timeline-date-from"
            type="date"
            value={filters.dateFrom}
            onChange={(event) =>
              onChange("dateFrom", event.target.value)
            }
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="timeline-date-to"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            To
          </label>

          <input
            id="timeline-date-to"
            type="date"
            value={filters.dateTo}
            onChange={(event) =>
              onChange("dateTo", event.target.value)
            }
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>
    </div>
  );
};

export default TimelineFilters;
