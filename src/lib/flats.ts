/** Flat numbers offered in the dropdown (1–20). */
export const FLAT_NUMBER_MAX = 20;

/** Unused flat numbers for a building; optionally keep the current number when editing. */
export function availableFlatNumbers(taken: string[], keep?: string) {
  const used = new Set(taken.map((n) => n.trim()));
  if (keep) used.delete(keep.trim());
  return Array.from({ length: FLAT_NUMBER_MAX }, (_, i) => String(i + 1)).filter(
    (n) => !used.has(n),
  );
}
