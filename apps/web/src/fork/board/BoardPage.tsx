import { scopedThreadKey, scopeThreadRef } from "@t3tools/client-runtime/environment";
import {
  derivePhysicalProjectKey,
  selectProjectGroupingSettings,
} from "@t3tools/client-runtime/state/project-grouping";
import { useNavigate } from "@tanstack/react-router";
import { type CSSProperties, type DragEvent, useState } from "react";

import {
  resolveSidebarFolderDot,
  resolveThreadLastVisitedAt,
} from "../../components/Sidebar.logic";
import { Badge } from "../../components/ui/badge";
import { useClientSettings } from "../../hooks/useSettings";
import { useThreadActions } from "../../hooks/useThreadActions";
import { cn } from "../../lib/utils";
import { useProjects, useThreadShells } from "../../state/entities";
import { buildThreadRouteParams } from "../../threadRoutes";
import { buildPhysicalToLogicalProjectKeyMap } from "../../sidebarProjectGrouping";
import { useUiStateStore } from "../../uiStateStore";
import {
  BOARD_COLUMNS,
  type BoardColumn,
  boardColumnOf,
  dropAction,
  isSettled,
} from "./board.logic";

const COLUMN_DOT: Record<BoardColumn, string> = {
  idle: "bg-muted-foreground/50",
  working: "bg-info",
  review: "bg-warning",
  done: "bg-success",
};

/** A steady colour per sidebar group, so the same group always looks the same. */
function groupColor(id: string): string {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return `oklch(0.7 0.14 ${Math.abs(hash) % 360})`;
}

const DRAG_TYPE = "application/x-t3-fork-board-thread";

function timeAgo(iso: string, now: number): string {
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}

/** Every thread in every project as a board: idle, working, to review and done. */
export function BoardPage() {
  const navigate = useNavigate();
  const shells = useThreadShells();
  const projects = useProjects();
  const localVisited = useUiStateStore((store) => store.threadLastVisitedAtById);
  const { settleThread, unsettleThread } = useThreadActions();
  const [dropTarget, setDropTarget] = useState<BoardColumn | null>(null);
  const [now] = useState(() => Date.now());
  const groupingSettings = useClientSettings(selectProjectGroupingSettings);
  const userGroups = useUiStateStore((store) => store.sidebarProjectGroups);

  const projectName = new Map(
    projects.map((project) => [`${project.environmentId}:${project.id}`, project.title] as const),
  );
  const logicalKeyByPhysical = buildPhysicalToLogicalProjectKeyMap({
    projects,
    settings: groupingSettings,
    primaryEnvironmentId: null,
  });
  const userGroupByLogicalKey = new Map(
    userGroups.flatMap((group) => group.projectKeys.map((key) => [key, group] as const)),
  );
  const userGroupByProject = new Map(
    projects.map((project) => {
      const logical = logicalKeyByPhysical.get(derivePhysicalProjectKey(project));
      return [
        `${project.environmentId}:${project.id}`,
        logical === undefined ? undefined : userGroupByLogicalKey.get(logical),
      ] as const;
    }),
  );
  const cards = shells.flatMap((thread) => {
    if (thread.archivedAt !== null) return [];
    const ref = scopeThreadRef(thread.environmentId, thread.id);
    const key = scopedThreadKey(ref);
    const dot = resolveSidebarFolderDot([
      {
        ...thread,
        lastVisitedAt: resolveThreadLastVisitedAt(thread.lastVisitedAt, localVisited[key]),
      },
    ]);
    return [
      {
        key,
        ref,
        column: boardColumnOf(dot, isSettled(thread)),
        title: thread.title,
        project: projectName.get(`${thread.environmentId}:${thread.projectId}`) ?? "",
        group: userGroupByProject.get(`${thread.environmentId}:${thread.projectId}`) ?? null,
        updatedAt: thread.updatedAt,
      },
    ];
  });
  const byColumn = new Map(BOARD_COLUMNS.map((column) => [column.id, [] as typeof cards]));
  for (const card of cards.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))) {
    byColumn.get(card.column)!.push(card);
  }

  const onDrop = (event: DragEvent<HTMLElement>, to: BoardColumn) => {
    event.preventDefault();
    setDropTarget(null);
    const card = cards.find((candidate) => candidate.key === event.dataTransfer.getData(DRAG_TYPE));
    if (!card) return;
    const action = dropAction(card.column, to);
    if (action === "settle") void settleThread(card.ref);
    if (action === "unsettle") void unsettleThread(card.ref);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-4">
      <div className="flex items-baseline justify-between px-1">
        <h1 className="font-semibold text-lg">Board</h1>
        <span className="text-muted-foreground text-xs">
          Drag a card to Done to settle it, or from Done to Idle to reopen it.
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-4 gap-3">
        {BOARD_COLUMNS.map((column) => {
          const columnCards = byColumn.get(column.id) ?? [];
          return (
            <section
              key={column.id}
              aria-label={column.title}
              onDragOver={(event) => {
                if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
                event.preventDefault();
                if (dropTarget !== column.id) setDropTarget(column.id);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDropTarget(null);
                }
              }}
              onDrop={(event) => onDrop(event, column.id)}
              className={cn(
                "flex min-h-0 flex-col rounded-xl border bg-muted/30",
                dropTarget === column.id && "ring-2 ring-inset ring-ring",
              )}
            >
              <header className="flex items-center gap-2 border-b px-3 py-2.5">
                <span
                  aria-hidden
                  className={cn("inline-block size-2 rounded-full", COLUMN_DOT[column.id])}
                />
                <span className="shrink-0 whitespace-nowrap font-medium text-sm">
                  {column.title}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {columnCards.length}
                </span>
                <span className="ml-auto truncate text-2xs text-muted-foreground/80">
                  {column.hint}
                </span>
              </header>
              <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-2">
                {columnCards.length === 0 ? (
                  <li className="py-6 text-center text-muted-foreground text-xs">Empty</li>
                ) : null}
                {columnCards.map((card) => (
                  <li key={card.key}>
                    <button
                      type="button"
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(DRAG_TYPE, card.key);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={() =>
                        void navigate({
                          to: "/$environmentId/$threadId",
                          params: buildThreadRouteParams(card.ref),
                        })
                      }
                      className="flex w-full flex-col items-start gap-0.5 rounded-lg border bg-background px-3 py-2 text-left outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      {card.group ? (
                        <Badge
                          size="sm"
                          variant="label"
                          className="max-w-full"
                          style={{ "--label": groupColor(card.group.id) } as CSSProperties}
                        >
                          <span className="truncate">{card.group.name}</span>
                        </Badge>
                      ) : null}
                      <span className="line-clamp-2 font-medium text-sm">{card.title}</span>
                      <span className="flex w-full items-center justify-between gap-2 text-muted-foreground text-xs">
                        <span className="truncate">{card.project}</span>
                        <span className="shrink-0 tabular-nums">
                          {timeAgo(card.updatedAt, now)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
