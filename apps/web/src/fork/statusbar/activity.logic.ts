export type ActivityStatus = "attention" | "failed" | "unread" | "working";

export const ACTIVITY_LABEL: Record<ActivityStatus, string> = {
  attention: "Needs you",
  failed: "Failed",
  unread: "Done",
  working: "Working",
};

const ORDER: Record<ActivityStatus, number> = { attention: 0, failed: 1, unread: 2, working: 3 };

export interface ActivityThread {
  readonly key: string;
  readonly status: ActivityStatus;
}

/** Most urgent first; counts per status for the bar. */
export function summarizeActivity<T extends ActivityThread>(
  threads: readonly T[],
): { readonly sorted: T[]; readonly counts: Record<ActivityStatus, number> } {
  const counts = { attention: 0, failed: 0, unread: 0, working: 0 };
  for (const thread of threads) counts[thread.status] += 1;
  return { sorted: threads.toSorted((a, b) => ORDER[a.status] - ORDER[b.status]), counts };
}

/**
 * Threads that just finished or started needing you, so a notice can say so. A thread already in
 * that state, or seen for the first time, does not count.
 */
export function newlyNeedingYou(
  previous: ReadonlyMap<string, ActivityStatus>,
  current: readonly ActivityThread[],
): ActivityThread[] {
  return current.filter((thread) => {
    if (thread.status !== "attention" && thread.status !== "unread" && thread.status !== "failed") {
      return false;
    }
    const before = previous.get(thread.key);
    return before === "working";
  });
}
