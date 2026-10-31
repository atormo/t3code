import type { SidebarProjectGroup } from "../../uiStateStore";

/** A sidebar tab such as "Work" or "Personal". It owns projects and folders; nothing on disk moves. */
export interface SidebarSpace {
  id: string;
  name: string;
  projectKeys: string[];
}

/** Each space, and the no-space view, has its own Parked folder for projects on hold. It sits last. */
export function parkedGroupId(spaceId: string | null): string {
  return spaceId === null ? "parked" : `parked:${spaceId}`;
}

export function isParkedGroup(group: Pick<SidebarProjectGroup, "id">): boolean {
  return group.id === "parked" || group.id.startsWith("parked:");
}

export function spaceOfParkedGroupId(groupId: string): string | null {
  return groupId.startsWith("parked:") ? groupId.slice("parked:".length) : null;
}

function parkedGroup(spaceId: string | null): SidebarProjectGroup {
  return {
    id: parkedGroupId(spaceId),
    name: "Parked",
    projectKeys: [],
    ...(spaceId === null ? {} : { spaceId }),
  };
}

let lastGroups: readonly SidebarProjectGroup[] | null = null;
let lastSpaceId: string | null = null;
let lastVisible: SidebarProjectGroup[] = [];

/**
 * The folders a space shows: its own, any not filed in a space yet, and its Parked folder last.
 * The all-projects view (no active space) shows every folder and one Parked holding all parked
 * projects. Same inputs, same array, so memoized rows stay put.
 */
export function visibleSidebarGroups(
  groups: readonly SidebarProjectGroup[],
  activeSpaceId: string | null,
): SidebarProjectGroup[] {
  if (groups === lastGroups && activeSpaceId === lastSpaceId) return lastVisible;
  lastGroups = groups;
  lastSpaceId = activeSpaceId;
  const folders = groups.filter(
    (group) =>
      !isParkedGroup(group) &&
      (activeSpaceId === null || group.spaceId === undefined || group.spaceId === activeSpaceId),
  );
  const parked =
    activeSpaceId === null
      ? {
          ...parkedGroup(null),
          projectKeys: groups.filter(isParkedGroup).flatMap((group) => group.projectKeys),
        }
      : (groups.find((group) => group.id === parkedGroupId(activeSpaceId)) ??
        parkedGroup(activeSpaceId));
  lastVisible = [...folders, parked];
  return lastVisible;
}

/** Adds the Parked folder a move targets when it does not exist yet. */
export function ensureParkedGroup(
  groups: readonly SidebarProjectGroup[],
  groupId: string,
): readonly SidebarProjectGroup[] {
  if (!isParkedGroup(groups.find((group) => group.id === groupId) ?? { id: groupId }))
    return groups;
  if (groups.some((group) => group.id === groupId)) return groups;
  return [...groups, parkedGroup(spaceOfParkedGroupId(groupId))];
}

/** Moves a folder in front of another. Parked folders never move and nothing goes after them. */
export function placeGroupBefore(
  groups: readonly SidebarProjectGroup[],
  groupId: string,
  beforeGroupId: string,
): readonly SidebarProjectGroup[] {
  const moving = groups.find((group) => group.id === groupId);
  if (!moving || groupId === beforeGroupId || isParkedGroup(moving)) return groups;
  const rest = groups.filter((group) => group.id !== groupId);
  const index = rest.findIndex((group) => group.id === beforeGroupId);
  if (index < 0) return groups;
  return [...rest.slice(0, index), moving, ...rest.slice(index)];
}

/** Moves a space tab to where another one is, the way dragging a browser tab does. */
export function moveSpaceToIndexOf(
  spaces: readonly SidebarSpace[],
  spaceId: string,
  targetSpaceId: string,
): readonly SidebarSpace[] {
  const from = spaces.findIndex((space) => space.id === spaceId);
  const to = spaces.findIndex((space) => space.id === targetSpaceId);
  if (from < 0 || to < 0 || from === to) return spaces;
  const next = [...spaces];
  const [moving] = next.splice(from, 1);
  next.splice(to, 0, moving!);
  return next;
}

/** A project shows in the active space when it belongs there or has not been filed in any space. */
export function isProjectInSpace(
  projectKey: string,
  spaces: readonly SidebarSpace[],
  activeSpaceId: string | null,
): boolean {
  if (activeSpaceId === null) return true;
  const owner = spaces.find((space) => space.projectKeys.includes(projectKey));
  return owner === undefined || owner.id === activeSpaceId;
}

export function assignProjectToSpace(
  spaces: readonly SidebarSpace[],
  projectKey: string,
  spaceId: string,
): SidebarSpace[] {
  return spaces.map((space) => {
    const projectKeys = space.projectKeys.filter((key) => key !== projectKey);
    if (space.id === spaceId) projectKeys.push(projectKey);
    return { ...space, projectKeys };
  });
}

/**
 * The first space adopts everything already in the sidebar, so making it hides nothing.
 * Later spaces start empty.
 */
export function createSpace(
  state: { spaces: readonly SidebarSpace[]; groups: readonly SidebarProjectGroup[] },
  space: { id: string; name: string },
  visibleProjectKeys: readonly string[],
): { spaces: SidebarSpace[]; groups: SidebarProjectGroup[] } {
  const first = state.spaces.length === 0;
  return {
    spaces: [
      ...state.spaces,
      { id: space.id, name: space.name, projectKeys: first ? [...visibleProjectKeys] : [] },
    ],
    groups: first
      ? state.groups.map((group) =>
          group.spaceId !== undefined
            ? group
            : group.id === "parked"
              ? { ...group, id: parkedGroupId(space.id), spaceId: space.id }
              : { ...group, spaceId: space.id },
        )
      : [...state.groups],
  };
}

/** Deleting a space drops its folders; its projects stay and show in every space until filed. */
export function deleteSpace(
  state: { spaces: readonly SidebarSpace[]; groups: readonly SidebarProjectGroup[] },
  spaceId: string,
): { spaces: SidebarSpace[]; groups: SidebarProjectGroup[] } {
  return {
    spaces: state.spaces.filter((space) => space.id !== spaceId),
    groups: state.groups.filter((group) => group.spaceId !== spaceId),
  };
}
