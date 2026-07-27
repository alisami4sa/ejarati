import { toGregorian, toHijri } from "hijri-converter";
import { formatDate } from "@/lib/format";

export type CalendarType = "hijri" | "gregorian";

const HIJRI_MONTHS = [
  "محرم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوال",
  "ذو القعدة",
  "ذو الحجة",
];

export function hijriMonthName(month: number) {
  return HIJRI_MONTHS[month - 1] ?? String(month);
}

export function gregorianToHijriParts(date: Date) {
  return toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function hijriPartsToGregorian(hy: number, hm: number, hd: number) {
  const g = toGregorian(hy, hm, hd);
  return new Date(g.gy, g.gm - 1, g.gd, 12, 0, 0, 0);
}

export function formatDeedDate(
  date: Date | null | undefined,
  calendar: string | null | undefined,
) {
  if (!date) return null;
  if (calendar === "hijri") {
    const { hy, hm, hd } = gregorianToHijriParts(date);
    return `${hd} ${hijriMonthName(hm)} ${hy} هـ`;
  }
  return `${formatDate(date)} م`;
}

export function currentHijriYear() {
  const now = new Date();
  return toHijri(now.getFullYear(), now.getMonth() + 1, now.getDate()).hy;
}
