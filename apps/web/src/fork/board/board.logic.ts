export type BoardColumn = "idle" | "working" | "review" | "done";

export const BOARD_COLUMNS: ReadonlyArray<{ id: BoardColumn; title: string; hint: string }> = [
  { id: "idle", title: "Idle", hint: "Nothing running, already seen" },
  { id: "working", title: "Working", hint: "The agent is on it" },
  { id: "review", title: "To review", hint: "Needs you, failed, or finished unseen" },
  { id: "done", title: "Done", hint: "Settled threads" },
];

/** The sidebar's status dot for a thread, or null when there is nothing to flag. */
export type ThreadDot = "attention" | "failed" | "unread" | "working" | null;

/** Settled unless it was unsettled after the last settle. */
export function isSettled(thread: {
  readonly settledAt: string | null;
  readonly unsettledAt: string | null;
}): boolean {
  if (thread.settledAt === null) return false;
  return thread.unsettledAt === null || thread.unsettledAt < thread.settledAt;
}

/** Work and anything that needs you win over Done, so a settled thread that wakes up moves. */
export function boardColumnOf(dot: ThreadDot, settled: boolean): BoardColumn {
  if (dot === "working") return "working";
  if (dot === "attention" || dot === "failed" || dot === "unread") return "review";
  return settled ? "done" : "idle";
}

/** Dropping on Done settles a thread; dropping a Done thread on Idle reopens it. */
export function dropAction(from: BoardColumn, to: BoardColumn): "settle" | "unsettle" | null {
  if (to === "done" && from !== "done") return "settle";
  if (from === "done" && to === "idle") return "unsettle";
  return null;
}
