import {
  Activity,
  RefreshCw,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";

import Timeline from "../../components/timeline/Timeline";
import TimelineFilters from "../../components/timeline/TimelineFilters";
import TimelineSkeleton from "../../components/timeline/TimelineSkeleton";
import { getTimeline } from "../../services/timeline.service";
import type {
  TimelineFilters as TimelineFiltersType,
  TimelineItem,
} from "../../types/timeline";

const INITIAL_FILTERS: TimelineFiltersType = {
  module: "",
  action: "",
  search: "",
  dateFrom: "",
  dateTo: "",
};

const normalizeValue = (value: unknown) =>
  String(value ?? "").trim().toLowerCase();

const TimelinePage = () => {
  const [filters, setFilters] =
    useState<TimelineFiltersType>(INITIAL_FILTERS);

  const {
    data: activities = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery<TimelineItem[]>({
    queryKey: ["timeline"],
    queryFn: getTimeline,
  });

  const modules = useMemo(() => {
    return Array.from(
      new Set(
        activities
          .map((item) => item.module)
          .filter(Boolean),
      ),
    ).sort();
  }, [activities]);

  const actions = useMemo(() => {
    return Array.from(
      new Set(
        activities
          .map((item) => item.action)
          .filter(Boolean),
      ),
    ).sort();
  }, [activities]);

  const filteredActivities = useMemo(() => {
    const search = normalizeValue(filters.search);

    return activities
      .filter((item) => {
        if (
          filters.module &&
          item.module !== filters.module
        ) {
          return false;
        }

        if (
          filters.action &&
          item.action !== filters.action
        ) {
          return false;
        }

        if (search) {
          const searchableText = [
            item.description,
            item.module,
            item.action,
            item.user?.fullName,
            item.user?.email,
            item.entityId,
          ]
            .filter(Boolean)
            .join(" ");

          if (
            !normalizeValue(searchableText).includes(search)
          ) {
            return false;
          }
        }

        if (filters.dateFrom) {
          const itemDate = new Date(item.createdAt);
          const fromDate = new Date(
            `${filters.dateFrom}T00:00:00`,
          );

          if (itemDate < fromDate) {
            return false;
          }
        }

        if (filters.dateTo) {
          const itemDate = new Date(item.createdAt);
          const toDate = new Date(
            `${filters.dateTo}T23:59:59.999`,
          );

          if (itemDate > toDate) {
            return false;
          }
        }

        return true;
      })
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      );
  }, [activities, filters]);

  const handleFilterChange = (
    key: keyof TimelineFiltersType,
    value: string,
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Timeline refreshed.");
    } catch {
      toast.error("Unable to refresh timeline.");
    }
  };

  const totalActivities = activities.length;
  const visibleActivities = filteredActivities.length;

  const todayActivities = activities.filter((item) => {
    const created = new Date(item.createdAt);
    const now = new Date();

    return (
      created.getDate() === now.getDate() &&
      created.getMonth() === now.getMonth() &&
      created.getFullYear() === now.getFullYear()
    );
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Timeline
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Chronological view of activity across the LYFads
            ERP system.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isFetching}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              isFetching ? "animate-spin" : ""
            }`}
          />

          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Activities
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalActivities}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Today
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {todayActivities}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50">
              <Timer className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Showing
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {visibleActivities}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-violet-50">
              <ShieldCheck className="h-5 w-5 text-violet-600" />
            </div>
          </div>
        </div>
      </div>

      <TimelineFilters
        filters={filters}
        modules={modules}
        actions={actions}
        onChange={handleFilterChange}
        onReset={handleReset}
      />

      {isLoading ? (
        <TimelineSkeleton />
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="text-sm font-semibold text-red-800">
            Unable to load timeline
          </h2>

          <p className="mt-1 text-sm text-red-600">
            The activity log service could not be loaded.
          </p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : (
        <Timeline items={filteredActivities} />
      )}
    </div>
  );
};

export default TimelinePage;
