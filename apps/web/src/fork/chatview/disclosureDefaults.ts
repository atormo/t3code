/**
 * Fork: with "show the agent's work as it happens", disclosures open by default and the set
 * records the ones you closed. Without it the set records the ones you opened, as upstream.
 */
export function isDisclosureOpen<Id>(
  toggled: ReadonlySet<Id> | undefined,
  id: Id,
  openByDefault: boolean,
): boolean {
  return (toggled?.has(id) ?? false) !== openByDefault;
}

/** Makes sure a disclosure shows open, whichever way the set reads. */
export function openDisclosure<Id>(
  toggled: ReadonlySet<Id>,
  id: Id,
  openByDefault: boolean,
): ReadonlySet<Id> {
  if (isDisclosureOpen(toggled, id, openByDefault)) return toggled;
  const next = new Set(toggled);
  if (openByDefault) next.delete(id);
  else next.add(id);
  return next;
}
