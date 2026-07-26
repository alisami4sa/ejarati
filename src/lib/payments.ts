import { startOfDayLocal, startOfYearLocal, endOfYearLocal } from "@/lib/dates";

type InstallmentLike = {
  amount: number;
  status: string;
  dueDate: Date;
  paidAt?: Date | null;
};

/** Paid this calendar year (by payment date, fallback due date). */
export function sumPaidThisYear(installments: InstallmentLike[], now = new Date()) {
  const from = startOfYearLocal(now);
  const to = endOfYearLocal(now);
  return installments.reduce((sum, inst) => {
    if (inst.status !== "paid") return sum;
    const when = inst.paidAt ? startOfDayLocal(inst.paidAt) : startOfDayLocal(inst.dueDate);
    if (when >= from && when <= to) return sum + inst.amount;
    return sum;
  }, 0);
}

/**
 * Unpaid rent still expected through Dec 31 of this year
 * (includes overdue dues from this year + upcoming dues before year-end).
 */
export function sumUnpaidThroughYearEnd(
  installments: InstallmentLike[],
  now = new Date(),
) {
  const from = startOfYearLocal(now);
  const to = endOfYearLocal(now);
  return installments.reduce((sum, inst) => {
    if (inst.status === "paid") return sum;
    const due = startOfDayLocal(inst.dueDate);
    if (due >= from && due <= to) return sum + inst.amount;
    return sum;
  }, 0);
}
