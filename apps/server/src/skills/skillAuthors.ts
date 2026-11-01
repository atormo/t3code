/** Who made a skill, and its folder on GitHub when known. */
export interface SkillAuthor {
  readonly author: string | null;
  readonly githubUrl: string | null;
}

interface LockEntry {
  readonly source?: unknown;
  readonly sourceType?: unknown;
  readonly skillPath?: unknown;
}

/** `npx skills add` records each skill's GitHub source in `~/.agents/.skill-lock.json`. */
export function authorFromSkillLock(lock: unknown, skillName: string): SkillAuthor | null {
  const skills = (lock as { skills?: Record<string, LockEntry> } | null)?.skills;
  const entry = skills?.[skillName];
  if (!entry || typeof entry.source !== "string" || !entry.source.includes("/")) return null;
  const [owner] = entry.source.split("/");
  if (entry.sourceType !== "github") return { author: owner ?? null, githubUrl: null };
  const folder =
    typeof entry.skillPath === "string" ? entry.skillPath.replace(/\/?SKILL\.md$/, "") : "";
  const base = `https://github.com/${entry.source}`;
  return { author: owner ?? null, githubUrl: folder === "" ? base : `${base}/tree/HEAD/${folder}` };
}

/** `author:` or `metadata.author:` in SKILL.md's front matter. */
export function authorFromFrontMatter(skillMd: string): string | null {
  const frontMatter = /^---\n([\s\S]*?)\n---/.exec(skillMd)?.[1];
  if (!frontMatter) return null;
  const match = /^\s*author:\s*["']?([^"'\n]+?)["']?\s*$/m.exec(frontMatter);
  return match?.[1]?.trim() || null;
}

/**
 * The copyright holder in a LICENSE file, such as "Benji Taylor". Only a line that starts with
 * "Copyright" and a year or (c) counts, so license templates like Apache's do not read as authors.
 */
export function authorFromLicense(license: string): string | null {
  const match = /^\s*copyright\s+(?:\(c\)|©)?\s*\d{4}(?:\s*[-–]\s*\d{4})?,?\s+([^\n<]+)$/im.exec(
    license,
  );
  const holder = match?.[1]
    ?.replace(/all rights reserved\.?/i, "")
    .trim()
    .replace(/[.,]$/, "")
    .trim();
  if (!holder || holder.length > 60 || /[[\]]|copyright owner/i.test(holder)) return null;
  return holder;
}

/** A plugin's `plugin.json` author, for skills that ship inside a plugin. */
export function authorFromPluginManifest(manifest: unknown): string | null {
  const author = (manifest as { author?: unknown } | null)?.author;
  if (typeof author === "string") return author.trim() || null;
  const name = (author as { name?: unknown } | null)?.name;
  return typeof name === "string" ? name.trim() || null : null;
}
