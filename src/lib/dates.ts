import { addDays, addMonths, addYears, differenceInCalendarDays, format } from "date-fns";

/** Parse yyyy-MM-dd as a local calendar date (noon) — avoids UTC day-shift. */
export function parseDateInput(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("تاريخ غير صالح");
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function startOfDayLocal(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfYearLocal(date = new Date()) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

export function startOfYearLocal(date = new Date()) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

export function toDateKey(date: Date) {
  return format(startOfDayLocal(date), "yyyy-MM-dd");
}

export function generateInstallmentDates(
  startDate: Date,
  installmentCount: number,
): Date[] {
  if (installmentCount < 1) return [];
  const intervalMonths = 12 / installmentCount;
  if (!Number.isFinite(intervalMonths) || intervalMonths <= 0) {
    throw new Error("عدد الدفعات غير صالح");
  }

  const base = startOfDayLocal(startDate);
  base.setHours(12, 0, 0, 0);

  const dates: Date[] = [];
  for (let i = 0; i < installmentCount; i++) {
    dates.push(addMonths(base, Math.round(intervalMonths * i)));
  }
  return dates;
}

/** Next term after renewal: same length, starting on the previous end date. */
export function nextContractTerm(startDate: Date, endDate: Date) {
  const start = startOfDayLocal(startDate);
  start.setHours(12, 0, 0, 0);
  const end = startOfDayLocal(endDate);
  end.setHours(12, 0, 0, 0);

  const newStart = new Date(end);
  for (const years of [1, 2, 3, 4, 5]) {
    if (toDateKey(addYears(start, years)) === toDateKey(end)) {
      return { startDate: newStart, endDate: addYears(newStart, years) };
    }
  }

  const days = differenceInCalendarDays(end, start);
  return {
    startDate: newStart,
    endDate: addDays(newStart, Math.max(days, 1)),
  };
}
