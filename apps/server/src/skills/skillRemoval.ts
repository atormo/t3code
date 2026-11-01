/** Folders whose `skills/` children are skills a person installed by hand. */
const SKILL_HOMES = new Set([".claude", ".codex", ".agents"]);

/**
 * The skill folder a reported path points at, or null when it is not one you may remove: it must
 * sit directly in a `.claude/skills`, `.codex/skills` or `.agents/skills` folder, outside plugins.
 */
export function removableSkillDirectory(skillPath: string): string | null {
  const normalized = skillPath.replaceAll("\\", "/").replace(/\/+$/, "");
  if (!normalized.startsWith("/") || normalized.split("/").includes("..")) return null;
  if (normalized.includes("/plugins/")) return null;
  const directory = normalized.endsWith("/SKILL.md")
    ? normalized.slice(0, -"/SKILL.md".length)
    : normalized;
  const parts = directory.split("/");
  const name = parts.at(-1);
  if (!name || parts.at(-2) !== "skills" || !SKILL_HOMES.has(parts.at(-3) ?? "")) return null;
  return directory;
}

/** The SKILL.md a reported skill path points at, or null for anything else. */
export function skillFileOf(skillPath: string): string | null {
  const normalized = skillPath.replaceAll("\\", "/").replace(/\/+$/, "");
  if (!normalized.startsWith("/") || normalized.split("/").includes("..")) return null;
  return normalized.endsWith("/SKILL.md") ? normalized : `${normalized}/SKILL.md`;
}

/** `https://github.com/owner/repo/tree/HEAD/path` for a folder in a clone of a GitHub repository. */
export function githubTreeUrl(remote: string, repoRoot: string, directory: string): string | null {
  const match = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(remote.trim());
  if (!match) return null;
  const root = repoRoot.replace(/\/+$/, "");
  if (directory !== root && !directory.startsWith(`${root}/`)) return null;
  const relative = directory.slice(root.length + 1);
  const base = `https://github.com/${match[1]}/${match[2]}`;
  return relative === "" ? base : `${base}/tree/HEAD/${relative}`;
}
