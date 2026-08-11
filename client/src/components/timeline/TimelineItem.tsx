import {
  Activity,
  CheckCircle2,
  Clock3,
  FileText,
  Flag,
  FolderKanban,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

import type { TimelineItem as TimelineItemType } from "../../types/timeline";

type Props = {
  item: TimelineItemType;
};

const getModuleIcon = (module: string) => {
  const normalized = module.toUpperCase();

  if (normalized.includes("PROJECT")) {
    return FolderKanban;
  }

  if (normalized.includes("TASK")) {
    return CheckCircle2;
  }

  if (normalized.includes("MILESTONE")) {
    return Flag;
  }

  if (normalized.includes("EMPLOYEE")) {
    return Users;
  }

  if (normalized.includes("CLIENT")) {
    return UserRound;
  }

  if (normalized.includes("COMMENT")) {
    return MessageSquare;
  }

  if (
    normalized.includes("TIMESHEET") ||
    normalized.includes("ATTENDANCE")
  ) {
    return Clock3;
  }

  if (normalized.includes("REPORT")) {
    return FileText;
  }

  return Activity;
};

const getActionIcon = (action: string) => {
  const normalized = action.toUpperCase();

  if (normalized === "CREATE") {
    return Plus;
  }

  if (normalized === "UPDATE") {
    return Pencil;
  }

  if (normalized === "DELETE") {
    return Trash2;
  }

  if (
    normalized === "APPROVE" ||
    normalized === "COMPLETE"
  ) {
    return CheckCircle2;
  }

  if (normalized === "REJECT") {
    return XCircle;
  }

  return Activity;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatModule = (module: string) => {
  return module
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const formatAction = (action: string) => {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const TimelineItem = ({ item }: Props) => {
  const ModuleIcon = getModuleIcon(item.module);
  const ActionIcon = getActionIcon(item.action);

  const userName =
    item.user?.fullName ||
    item.user?.email ||
    "System";

  return (
    <article className="relative flex gap-4">
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
        <ModuleIcon className="h-5 w-5 text-slate-600" />
      </div>

      <div className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                <ModuleIcon className="h-3.5 w-3.5" />
                {formatModule(item.module)}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                <ActionIcon className="h-3.5 w-3.5" />
                {formatAction(item.action)}
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-700">
              {item.description || "Activity recorded."}
            </p>
          </div>

          <time
            dateTime={item.createdAt}
            className="shrink-0 text-xs font-medium text-slate-500"
          >
            {formatDateTime(item.createdAt)}
          </time>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span>
            By{" "}
            <span className="font-medium text-slate-700">
              {userName}
            </span>
          </span>

          {item.entityId && (
            <span>
              ID:{" "}
              <span className="font-mono text-slate-600">
                {item.entityId}
              </span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default TimelineItem;
