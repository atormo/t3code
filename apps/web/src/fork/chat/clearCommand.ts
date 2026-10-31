/**
 * Claude Code lists `/clear`, but it only works in its own terminal. In T3 a fresh context is a
 * new thread, so `/clear` on its own starts one in the same project.
 */
export function isClearCommand(prompt: string): boolean {
  return prompt.trim().toLowerCase() === "/clear";
}
