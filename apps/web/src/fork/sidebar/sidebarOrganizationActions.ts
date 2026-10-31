import { getProjectOrderKey } from "@t3tools/client-runtime/state/project-grouping";
import type { EnvironmentProject } from "@t3tools/client-runtime/state/shell";

import { randomUUID } from "../../lib/utils";
import { useUiStateStore } from "../../uiStateStore";
import {
  assignProjectToSpace,
  createSpace,
  deleteSpace,
  moveSpaceToIndexOf,
  parkedGroupId,
  spaceOfParkedGroupId,
} from "./projectOrganization";
import { useSidebarSpacesStore } from "./sidebarSpacesStore";

/** Moves a project into a folder; a folder in a space files the project in that space too. */
export function moveProjectToGroup(projectKey: string, targetGroupId: string | null) {
  const ui = useUiStateStore.getState();
  // The all-projects view shows one Parked; a project parked there goes to its own space's.
  const owner = useSidebarSpacesStore
    .getState()
    .spaces.find((space) => space.projectKeys.includes(projectKey));
  const groupId =
    targetGroupId === parkedGroupId(null) && owner ? parkedGroupId(owner.id) : targetGroupId;
  ui.moveProjectToSidebarGroup(projectKey, groupId);
  if (groupId === null) return;
  const group = ui.sidebarProjectGroups.find((candidate) => candidate.id === groupId);
  const spaceId = group?.spaceId ?? spaceOfParkedGroupId(groupId);
  if (spaceId === null) return;
  const spaces = useSidebarSpacesStore.getState();
  spaces.setSpaces(assignProjectToSpace(spaces.spaces, projectKey, spaceId), spaces.activeSpaceId);
}

/** Files a project in another space; it leaves any folder of the space it came from. */
export function moveProjectToSpace(projectKey: string, spaceId: string) {
  const spaces = useSidebarSpacesStore.getState();
  spaces.setSpaces(assignProjectToSpace(spaces.spaces, projectKey, spaceId), spaces.activeSpaceId);
  const ui = useUiStateStore.getState();
  const folder = ui.sidebarProjectGroups.find((group) => group.projectKeys.includes(projectKey));
  if (folder && folder.spaceId !== spaceId) ui.moveProjectToSidebarGroup(projectKey, null);
}

/** Moves a folder, with every project in it, to another space. */
export function moveGroupToSpace(groupId: string, spaceId: string) {
  const ui = useUiStateStore.getState();
  const group = ui.sidebarProjectGroups.find((candidate) => candidate.id === groupId);
  if (!group || group.spaceId === spaceId) return;
  ui.setSidebarProjectGroups(
    ui.sidebarProjectGroups.map((candidate) =>
      candidate.id === groupId ? { ...candidate, spaceId } : candidate,
    ),
  );
  const spaces = useSidebarSpacesStore.getState();
  let next = spaces.spaces;
  for (const key of group.projectKeys) next = assignProjectToSpace(next, key, spaceId);
  spaces.setSpaces(next, spaces.activeSpaceId);
}

export function addSpace(name: string, visibleProjectKeys: readonly string[]) {
  const trimmed = name.trim();
  if (trimmed.length === 0) return;
  const ui = useUiStateStore.getState();
  const spaces = useSidebarSpacesStore.getState();
  const id = randomUUID();
  const next = createSpace(
    { spaces: spaces.spaces, groups: ui.sidebarProjectGroups },
    { id, name: trimmed },
    visibleProjectKeys,
  );
  ui.setSidebarProjectGroups(next.groups);
  spaces.setSpaces(next.spaces, id);
}

export function renameSpace(spaceId: string, name: string) {
  const trimmed = name.trim();
  if (trimmed.length === 0) return;
  const spaces = useSidebarSpacesStore.getState();
  spaces.setSpaces(
    spaces.spaces.map((space) => (space.id === spaceId ? { ...space, name: trimmed } : space)),
    spaces.activeSpaceId,
  );
}

export function removeSpace(spaceId: string) {
  const ui = useUiStateStore.getState();
  const spaces = useSidebarSpacesStore.getState();
  const next = deleteSpace({ spaces: spaces.spaces, groups: ui.sidebarProjectGroups }, spaceId);
  ui.setSidebarProjectGroups(next.groups);
  spaces.setSpaces(
    next.spaces,
    spaces.activeSpaceId === spaceId ? (next.spaces[0]?.id ?? null) : spaces.activeSpaceId,
  );
}

export function moveSpace(spaceId: string, targetSpaceId: string) {
  const spaces = useSidebarSpacesStore.getState();
  spaces.setSpaces(
    [...moveSpaceToIndexOf(spaces.spaces, spaceId, targetSpaceId)],
    spaces.activeSpaceId,
  );
}

/** A thread started with no project gets its own scratch project; it stays in the open space. */
export function fileScratchProjectInActiveSpace(
  project: Pick<EnvironmentProject, "environmentId" | "workspaceRoot">,
) {
  const spaces = useSidebarSpacesStore.getState();
  if (spaces.activeSpaceId === null) return;
  spaces.setSpaces(
    assignProjectToSpace(spaces.spaces, getProjectOrderKey(project), spaces.activeSpaceId),
    spaces.activeSpaceId,
  );
}
