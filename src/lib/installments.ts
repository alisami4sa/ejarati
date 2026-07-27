export { generateInstallmentDates } from "@/lib/dates";

/**
 * Split annual rent into installment amounts that always sum exactly to rent.
 * Only used when creating a contract — estimated flat rent stays undivided.
 */
export function splitRentInstallments(
  rentAmount: number,
  installmentCount: number,
): number[] {
  if (installmentCount <= 0) return [];
  const total = Math.round(rentAmount);
  const base = Math.floor(total / installmentCount);
  const remainder = total - base * installmentCount;
  return Array.from({ length: installmentCount }, (_, i) =>
    i === installmentCount - 1 ? base + remainder : base,
  );
}

/** @deprecated use splitRentInstallments — kept for any callers expecting a single amount */
export function installmentAmount(rentAmount: number, installmentCount: number) {
  if (installmentCount <= 0) return 0;
  return Math.floor(Math.round(rentAmount) / installmentCount);
}
