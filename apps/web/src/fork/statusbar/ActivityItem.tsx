import { scopedThreadKey, scopeThreadRef } from "@t3tools/client-runtime/environment";
import { ActivityIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useEffectEvent, useRef } from "react";

import {
  resolveSidebarFolderDot,
  resolveThreadLastVisitedAt,
} from "../../components/Sidebar.logic";
import { Button } from "../../components/ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "../../components/ui/popover";
import { toastManager } from "../../components/ui/toast";
import { stackedThreadToast } from "../../components/ui/toastHelpers";
import { useThreadRouteTarget } from "../../hooks/useThreadRouteTarget";
import { cn } from "../../lib/utils";
import { useProjects, useThreadShells } from "../../state/entities";
import { buildThreadRouteParams } from "../../threadRoutes";
import { useUiStateStore } from "../../uiStateStore";
import {
  ACTIVITY_LABEL,
  type ActivityStatus,
  newlyNeedingYou,
  summarizeActivity,
} from "./activity.logic";

const DOT_CLASS: Record<ActivityStatus, string> = {
  attention: "bg-warning",
  failed: "bg-error",
  unread: "bg-success",
  working: "bg-info",
};

function Dot({ status }: { status: ActivityStatus }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block size-2 shrink-0 rounded-full", DOT_CLASS[status])}
    />
  );
}

/**
 * Every thread that is working, waiting on you or finished unseen, across projects and spaces.
 * A thread you are not looking at that finishes or needs you also raises a notice.
 */
export function ActivityItem() {
  const navigate = useNavigate();
  const shells = useThreadShells();
  const projects = useProjects();
  const localVisited = useUiStateStore((store) => store.threadLastVisitedAtById);
  const routeTarget = useThreadRouteTarget();
  const currentKey = routeTarget?.kind === "server" ? scopedThreadKey(routeTarget.threadRef) : null;

  const projectName = new Map(
    projects.map((project) => [`${project.environmentId}:${project.id}`, project.title] as const),
  );
  const threads = shells.flatMap((thread) => {
    if (thread.archivedAt !== null) return [];
    const ref = scopeThreadRef(thread.environmentId, thread.id);
    const key = scopedThreadKey(ref);
    const status = resolveSidebarFolderDot([
      {
        ...thread,
        lastVisitedAt: resolveThreadLastVisitedAt(thread.lastVisitedAt, localVisited[key]),
      },
    ]);
    if (status === null) return [];
    return [
      {
        key,
        ref,
        status,
        title: thread.title,
        project: projectName.get(`${thread.environmentId}:${thread.projectId}`) ?? "",
      },
    ];
  });
  const { sorted, counts } = summarizeActivity(threads);

  const open = (ref: (typeof threads)[number]["ref"]) =>
    void navigate({ to: "/$environmentId/$threadId", params: buildThreadRouteParams(ref) });

  // Notices compare against the previous render's statuses, kept outside React state.
  const previousRef = useRef<Map<string, ActivityStatus> | null>(null);
  const statusKey = threads.map((thread) => `${thread.key}=${thread.status}`).join("|");
  const notify = useEffectEvent(() => {
    const previous = previousRef.current;
    previousRef.current = new Map(threads.map((thread) => [thread.key, thread.status]));
    if (previous === null) return;
    for (const thread of newlyNeedingYou(previous, threads)) {
      if (thread.key === currentKey) continue;
      const full = threads.find((candidate) => candidate.key === thread.key);
      if (!full) continue;
      toastManager.add(
        stackedThreadToast({
          type:
            full.status === "failed"
              ? "error"
              : full.status === "attention"
                ? "warning"
                : "success",
          title:
            full.status === "attention"
              ? `${full.title} needs you`
              : full.status === "failed"
                ? `${full.title} failed`
                : `${full.title} is done`,
          description: full.project,
          timeout: 10_000,
          actionProps: { children: "Open", onClick: () => open(full.ref) },
        }),
      );
    }
  });
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync, react/exhaustive-effect-dependencies -- raises a toast when a thread you are not viewing finishes or starts needing you
  useEffect(() => notify(), [statusKey]);

  if (sorted.length === 0) return null;
  const parts = (["attention", "failed", "unread", "working"] as const).filter(
    (status) => counts[status] > 0,
  );

  return (
    <Popover>
      <PopoverTrigger
        render={<Button size="micro" variant="ghost-muted" aria-label="Active threads" />}
      >
        <ActivityIcon aria-hidden />
        {parts.map((status) => (
          <span key={status} className="flex items-center gap-1 tabular-nums">
            <Dot status={status} />
            {counts[status]}
          </span>
        ))}
      </PopoverTrigger>
      <PopoverPopup side="top" align="end" sideOffset={8} className="w-80">
        <div className="flex flex-col gap-1 text-xs">
          <span className="border-b pb-2 font-medium text-sm">Activity</span>
          <ul className="flex max-h-80 flex-col overflow-y-auto">
            {sorted.map((thread) => (
              <li key={thread.key}>
                <button
                  type="button"
                  onClick={() => open(thread.ref)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    thread.key === currentKey && "bg-accent/60",
                  )}
                >
                  <span className="pt-1.5">
                    <Dot status={thread.status} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium text-foreground">{thread.title}</span>
                    <span className="truncate text-muted-foreground">
                      {thread.project ? `${thread.project} · ` : ""}
                      {ACTIVITY_LABEL[thread.status]}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </PopoverPopup>
    </Popover>
  );
}
