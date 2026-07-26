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

export function formatRemainingLabel(endDate: Date) {
  const r = remainingContract(endDate);
  if (r.ended) return "منتهي";
  if (r.months === 0) return `${r.days} يوم`;
  if (r.days === 0) return `${r.months} شهر`;
  return `${r.months} شهر و ${r.days} يوم`;
}

export function formatDueLabel(dueDate: Date) {
  const c = dueCountdown(dueDate);
  if (c.kind === "today") return "اليوم";
  if (c.kind === "remaining") return `متبقي ${c.days} يوم`;
  return `متأخر ${c.days} يوم`;
}
