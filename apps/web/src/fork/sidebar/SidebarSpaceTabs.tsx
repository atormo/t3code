import { PlusIcon } from "lucide-react";
import { useState } from "react";

import {
  type SidebarProjectGroupNameRequest,
  SidebarProjectGroupNameDialog,
} from "../../components/sidebar/SidebarProjectGroupNameDialog";
import { Button } from "../../components/ui/button";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../components/ui/tooltip";
import { readLocalApi } from "../../localApi";
import type { SidebarSpace } from "./projectOrganization";
import { addSpace, removeSpace, renameSpace } from "./sidebarOrganizationActions";
import { useSidebarSpacesStore } from "./sidebarSpacesStore";
import type { SidebarRowDragProps } from "./useSidebarProjectDrag";

/**
 * Tabs above the project list. Each space keeps its own projects, folders and Parked folder.
 * Drop a project or folder on a tab to file it there.
 */
export function SidebarSpaceTabs(props: {
  /** Projects on screen now; the first space adopts them so creating it hides nothing. */
  visibleProjectKeys: readonly string[];
  tabDragProps: (spaceId: string) => Omit<SidebarRowDragProps, "draggable" | "onDragStart">;
}) {
  const spaces = useSidebarSpacesStore((state) => state.spaces);
  const activeSpaceId = useSidebarSpacesStore((state) => state.activeSpaceId);
  const setActiveSpace = useSidebarSpacesStore((state) => state.setActiveSpace);
  const [nameRequest, setNameRequest] = useState<SidebarProjectGroupNameRequest | null>(null);

  const showMenu = async (space: SidebarSpace, position: { x: number; y: number }) => {
    const api = readLocalApi();
    if (!api) return;
    const clicked = await api.contextMenu
      .show(
        [
          { id: "rename", label: "Rename space" },
          { id: "delete", label: "Delete space", destructive: true, separatorBefore: true },
        ],
        position,
      )
      .catch(() => null);
    if (clicked === "rename") {
      setNameRequest({ kind: "rename", groupId: space.id, currentName: space.name });
    } else if (clicked === "delete") {
      const confirmed = await api.dialogs.confirm(
        `Delete the space "${space.name}"? Its folders go away; its projects stay and show in every space until you file them.`,
        { variant: "destructive" },
      );
      if (confirmed) removeSpace(space.id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label="Spaces"
      className="mb-1.5 flex items-center gap-0.5 overflow-x-auto px-(--sidebar-row-content-inset)"
    >
      {spaces.map((space) => (
        <Button
          key={space.id}
          role="tab"
          size="xs"
          variant={space.id === activeSpaceId ? "secondary" : "ghost-muted"}
          aria-selected={space.id === activeSpaceId}
          className="relative shrink-0"
          onClick={() => setActiveSpace(space.id)}
          onContextMenu={(event) => {
            event.preventDefault();
            void showMenu(space, { x: event.clientX, y: event.clientY });
          }}
          {...props.tabDragProps(space.id)}
        >
          {space.name}
        </Button>
      ))}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              size={spaces.length === 0 ? "xs" : "icon-xs"}
              variant="ghost-muted"
              aria-label="New space"
              onClick={() => setNameRequest({ kind: "create", projectKey: null })}
            />
          }
        >
          <PlusIcon aria-hidden />
          {spaces.length === 0 ? <span>New space</span> : null}
        </TooltipTrigger>
        <TooltipPopup>Spaces split projects into tabs, such as Work and Personal</TooltipPopup>
      </Tooltip>
      {nameRequest ? (
        <SidebarProjectGroupNameDialog
          noun="space"
          request={nameRequest}
          onCancel={() => setNameRequest(null)}
          onSubmit={(name) => {
            if (nameRequest.kind === "create") addSpace(name, props.visibleProjectKeys);
            else renameSpace(nameRequest.groupId, name);
            setNameRequest(null);
          }}
        />
      ) : null}
    </div>
  );
}
