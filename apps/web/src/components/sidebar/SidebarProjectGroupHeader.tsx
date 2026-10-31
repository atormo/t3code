import { ChevronDownIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { memo } from "react";

import { cn } from "~/lib/utils";
import type { SidebarProjectGroup } from "../../uiStateStore";

/**
 * A user folder in the boring sidebar. It sits above project folders like a shelf
 * label, so closing it hides every project and thread it holds.
 */
export const SidebarProjectGroupHeader = memo(function SidebarProjectGroupHeader(props: {
  group: SidebarProjectGroup;
  collapsed: boolean;
  projectCount: number;
  onToggle: (group: SidebarProjectGroup) => void;
  onContextMenu: (group: SidebarProjectGroup, position: { x: number; y: number }) => void;
}) {
  const { group, collapsed, projectCount } = props;
  const Icon = collapsed ? FolderIcon : FolderOpenIcon;
  return (
    <li
      data-testid="sidebar-project-group"
      className="group/project-group relative mt-3 list-none first:mt-0"
    >
      <button
        type="button"
        role="treeitem"
        tabIndex={-1}
        data-sidebar-row={`project-group:${group.id}`}
        aria-expanded={!collapsed}
        onClick={() => props.onToggle(group)}
        onContextMenu={(event) => {
          event.preventDefault();
          props.onContextMenu(group, { x: event.clientX, y: event.clientY });
        }}
        className="flex h-7 w-full cursor-pointer items-center gap-2 rounded-(--control-radius) px-(--sidebar-row-content-inset) text-left outline-none hover:bg-sidebar-row-hover focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <Icon aria-hidden className="size-3.5 shrink-0 text-sidebar-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold tracking-wide text-sidebar-muted-foreground uppercase">
          {group.name}
        </span>
        <span className="shrink-0 text-xs tabular-nums text-sidebar-muted-foreground">
          {projectCount}
        </span>
        <ChevronDownIcon
          aria-hidden
          className={cn(
            "size-3 shrink-0 text-sidebar-muted-foreground transition-transform",
            collapsed && "-rotate-90",
          )}
        />
      </button>
    </li>
  );
});
