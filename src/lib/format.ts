import {
  differenceInCalendarDays,
  differenceInMonths,
  addMonths,
  format,
} from "date-fns";
import { arSA } from "date-fns/locale";
import {
  endOfYearLocal,
  startOfDayLocal,
  startOfYearLocal,
  toDateKey,
} from "@/lib/dates";

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return toDateKey(d);
}

export function formatDateAr(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "d MMMM yyyy", { locale: arSA });
}

/** Remaining contract time as months + days (and total days). */
export function remainingContract(endDate: Date, now = new Date()) {
  const end = startOfDayLocal(endDate);
  const today = startOfDayLocal(now);
  if (today.getTime() > end.getTime()) {
    return { months: 0, days: 0, totalDays: 0, ended: true };
  }
  const totalDays = differenceInCalendarDays(end, today);
  const months = differenceInMonths(end, today);
  const afterMonths = addMonths(today, months);
  const days = differenceInCalendarDays(end, afterMonths);
  return { months, days, totalDays, ended: false };
}

export function dueCountdown(dueDate: Date, now = new Date()) {
  const due = startOfDayLocal(dueDate);
  const today = startOfDayLocal(now);
  const days = differenceInCalendarDays(due, today);
  if (days > 0) return { kind: "remaining" as const, days };
  if (days === 0) return { kind: "today" as const, days: 0 };
  return { kind: "overdue" as const, days: Math.abs(days) };
}

export function yearBounds(now = new Date()) {
  return { from: startOfYearLocal(now), to: endOfYearLocal(now) };
}

/** Currently inside the rental period (started and not ended). */
export function isActiveContract(
  startDate: Date,
  endDate: Date,
  status: string,
  now = new Date(),
) {
  if (status !== "active") return false;
  const today = startOfDayLocal(now).getTime();
  const start = startOfDayLocal(startDate).getTime();
  const end = startOfDayLocal(endDate).getTime();
  return today >= start && today <= end;
}

/**
 * Contract is on the books: status active and not past end date.
 * Includes contracts that start in the future (so they still show as occupied).
 */
export function isOpenContract(
  startDate: Date,
  endDate: Date,
  status: string,
  now = new Date(),
) {
  if (status !== "active") return false;
  const today = startOfDayLocal(now).getTime();
  const end = startOfDayLocal(endDate).getTime();
  return today <= end;
}

/** Ended by date (status may still be active) or manually closed. */
export function isEndedContract(
  endDate: Date,
  status: string,
  now = new Date(),
) {
  if (status === "inactive") return true;
  const today = startOfDayLocal(now).getTime();
  const end = startOfDayLocal(endDate).getTime();
  return today > end;
}

/** Keep Arabic + digits in RTL order (avoids "1 يوم 27 و شهر"). */
function rtlNum(n: number) {
  return `\u200F${n}`;
}

function arabicMonthPhrase(n: number) {
  if (n === 1) return "شهر";
  if (n === 2) return "شهران";
  if (n >= 3 && n <= 10) return `${rtlNum(n)} أشهر`;
  return `${rtlNum(n)} شهراً`;
}

function arabicDayPhrase(n: number) {
  if (n === 1) return "يوم";
  if (n === 2) return "يومان";
  if (n >= 3 && n <= 10) return `${rtlNum(n)} أيام`;
  return `${rtlNum(n)} يوماً`;
}

export function formatRemainingLabel(endDate: Date) {
  const r = remainingContract(endDate);
  if (r.ended) return "منتهي";
  if (r.months === 0) return arabicDayPhrase(r.days);
  if (r.days === 0) return arabicMonthPhrase(r.months);
  return `${arabicMonthPhrase(r.months)} و ${arabicDayPhrase(r.days)}`;
}

export function formatDueLabel(dueDate: Date) {
  const c = dueCountdown(dueDate);
  if (c.kind === "today") return "اليوم";
  if (c.kind === "remaining") return `متبقي ${arabicDayPhrase(c.days)}`;
  return `متأخر ${arabicDayPhrase(c.days)}`;
}
