import { type DragEvent, useRef, useState } from "react";

import { updateClientSettings, useClientSettings } from "../../hooks/useSettings";
import type { SidebarProjectSnapshot } from "../../sidebarProjectGrouping";
import { type SidebarProjectGroup, useUiStateStore } from "../../uiStateStore";
import { isParkedGroup } from "./projectOrganization";
import {
  moveGroupToSpace,
  moveProjectToGroup,
  moveProjectToSpace,
  moveSpace,
} from "./sidebarOrganizationActions";
import { useSidebarSpacesStore } from "./sidebarSpacesStore";
import "./sidebarDrag.css";

type DropMark = "before" | "after" | "into";
type Dragged =
  | { readonly kind: "project"; readonly projectKey: string }
  | { readonly kind: "group"; readonly groupId: string }
  | { readonly kind: "space"; readonly spaceId: string };

const DRAG_TYPE = "application/x-t3-fork-sidebar";

export interface SidebarRowDragProps {
  readonly draggable: boolean;
  readonly "data-fork-drop"?: DropMark;
  readonly onDragStart: (event: DragEvent<HTMLElement>) => void;
  readonly onDragOver: (event: DragEvent<HTMLElement>) => void;
  readonly onDragLeave: (event: DragEvent<HTMLElement>) => void;
  readonly onDrop: (event: DragEvent<HTMLElement>) => void;
  readonly onDragEnd: () => void;
}

/**
 * Drag and drop for the boring sidebar: drag a project onto another to reorder it (it joins
 * that project's folder), onto a folder header to move it in, drag folder headers to reorder
 * them. Finder folders dropped on the sidebar are upstream's `SidebarFolderDrop`.
 */
export function useSidebarProjectDrag(input: {
  readonly folders: readonly { readonly group: SidebarProjectSnapshot }[] | null;
  readonly groups: readonly SidebarProjectGroup[];
}) {
  const dragged = useRef<Dragged | null>(null);
  const [target, setTarget] = useState<{ id: string; mark: DropMark } | null>(null);
  const sortOrder = useClientSettings((settings) => settings.sidebarProjectSortOrder);
  const folders = input.folders ?? [];
  const folderIndex = (projectKey: string) =>
    folders.findIndex((folder) => folder.group.projectKey === projectKey);
  const groupOf = (projectKey: string) =>
    input.groups.find((group) => group.projectKeys.includes(projectKey))?.id ?? null;

  const end = () => {
    dragged.current = null;
    setTarget(null);
  };
  const mark = (event: DragEvent<HTMLElement>, id: string, dropMark: DropMark) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (target?.id !== id || target.mark !== dropMark) setTarget({ id, mark: dropMark });
  };
  const leave = (event: DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setTarget(null);
  };
  const start = (event: DragEvent<HTMLElement>, item: Dragged) => {
    dragged.current = item;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData(DRAG_TYPE, item.kind);
  };

  const dropProjectOnProject = (draggedKey: string, targetKey: string) => {
    const store = useUiStateStore.getState();
    moveProjectToGroup(draggedKey, groupOf(targetKey));
    // Freeze what is on screen as the manual order, then move the project within it.
    const membersOf = (projectKey: string) =>
      folders
        .find((folder) => folder.group.projectKey === projectKey)
        ?.group.memberProjects.map((member) => member.physicalProjectKey) ?? [];
    store.reorderProjects(
      folders.flatMap((folder) =>
        folder.group.memberProjects.map((member) => member.physicalProjectKey),
      ),
      membersOf(draggedKey),
      membersOf(targetKey),
    );
    if (sortOrder !== "manual") void updateClientSettings({ sidebarProjectSortOrder: "manual" });
  };

  const projectRowProps = (group: SidebarProjectSnapshot): SidebarRowDragProps => {
    const id = `project:${group.projectKey}`;
    return {
      draggable: true,
      ...(target?.id === id ? { "data-fork-drop": target.mark } : {}),
      onDragStart: (event) => start(event, { kind: "project", projectKey: group.projectKey }),
      onDragOver: (event) => {
        const item = dragged.current;
        if (item?.kind !== "project" || item.projectKey === group.projectKey) return;
        mark(
          event,
          id,
          folderIndex(item.projectKey) < folderIndex(group.projectKey) ? "after" : "before",
        );
      },
      onDragLeave: leave,
      onDrop: (event) => {
        const item = dragged.current;
        if (item?.kind !== "project" || item.projectKey === group.projectKey) return;
        event.preventDefault();
        event.stopPropagation();
        dropProjectOnProject(item.projectKey, group.projectKey);
        end();
      },
      onDragEnd: end,
    };
  };

  const groupRowProps = (group: SidebarProjectGroup): SidebarRowDragProps => {
    const id = `group:${group.id}`;
    return {
      draggable: !isParkedGroup(group),
      ...(target?.id === id ? { "data-fork-drop": target.mark } : {}),
      onDragStart: (event) => start(event, { kind: "group", groupId: group.id }),
      onDragOver: (event) => {
        const item = dragged.current;
        if (item?.kind === "project") mark(event, id, "into");
        else if (item?.kind === "group" && item.groupId !== group.id && !isParkedGroup(group)) {
          mark(event, id, "before");
        }
      },
      onDragLeave: leave,
      onDrop: (event) => {
        const item = dragged.current;
        if (!item || item.kind === "space") return;
        event.preventDefault();
        event.stopPropagation();
        if (item.kind === "project") moveProjectToGroup(item.projectKey, group.id);
        else if (!isParkedGroup(group)) {
          useUiStateStore.getState().placeSidebarProjectGroup(item.groupId, group.id);
        }
        end();
      },
      onDragEnd: end,
    };
  };

  /**
   * For a space tab: a project or folder dropped on it is filed in that space, and a tab
   * dropped on another takes its place.
   */
  const tabDragProps = (spaceId: string): SidebarRowDragProps => {
    const id = `space:${spaceId}`;
    const spaceIds = useSidebarSpacesStore.getState().spaces.map((space) => space.id);
    return {
      draggable: true,
      ...(target?.id === id ? { "data-fork-drop": target.mark } : {}),
      onDragStart: (event) => start(event, { kind: "space", spaceId }),
      onDragOver: (event: DragEvent<HTMLElement>) => {
        const item = dragged.current;
        if (!item) return;
        if (item.kind !== "space") mark(event, id, "into");
        else if (item.spaceId !== spaceId) {
          mark(
            event,
            id,
            spaceIds.indexOf(item.spaceId) < spaceIds.indexOf(spaceId) ? "after" : "before",
          );
        }
      },
      onDragLeave: leave,
      onDrop: (event: DragEvent<HTMLElement>) => {
        const item = dragged.current;
        if (!item) return;
        event.preventDefault();
        event.stopPropagation();
        if (item.kind === "project") moveProjectToSpace(item.projectKey, spaceId);
        else if (item.kind === "group") moveGroupToSpace(item.groupId, spaceId);
        else moveSpace(item.spaceId, spaceId);
        end();
      },
      onDragEnd: end,
    };
  };

  return { projectRowProps, groupRowProps, tabDragProps };
}
