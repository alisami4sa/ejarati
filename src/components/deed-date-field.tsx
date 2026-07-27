"use client";

import { useMemo, useState } from "react";
import { DatePickerField } from "@/components/date-picker";
import {
  currentHijriYear,
  gregorianToHijriParts,
  hijriMonthName,
  hijriPartsToGregorian,
  type CalendarType,
} from "@/lib/hijri";
import { formatDate } from "@/lib/format";

type Props = {
  defaultCalendar?: CalendarType | null;
  defaultDate?: string | null; // yyyy-MM-dd gregorian storage
};

export function DeedDateField({ defaultCalendar, defaultDate }: Props) {
  const [calendar, setCalendar] = useState<CalendarType>(
    defaultCalendar === "hijri" || defaultCalendar === "gregorian"
      ? defaultCalendar
      : "gregorian",
  );

  const initialHijri = useMemo(() => {
    if (!defaultDate) {
      const y = currentHijriYear();
      return { hy: y, hm: 1, hd: 1 };
    }
    const [y, m, d] = defaultDate.split("-").map(Number);
    return gregorianToHijriParts(new Date(y, m - 1, d, 12));
  }, [defaultDate]);

  const [hy, setHy] = useState(initialHijri.hy);
  const [hm, setHm] = useState(initialHijri.hm);
  const [hd, setHd] = useState(initialHijri.hd);

  const hijriAsGregorian = useMemo(() => {
    try {
      return formatDate(hijriPartsToGregorian(hy, hm, hd));
    } catch {
      return "";
    }
  }, [hy, hm, hd]);

  const years = useMemo(() => {
    const current = currentHijriYear();
    const list: number[] = [];
    for (let y = current + 5; y >= 1380; y -= 1) list.push(y);
    return list;
  }, []);

  return (
    <div className="span-2" style={{ display: "grid", gap: "0.85rem" }}>
      <fieldset className="field" style={{ border: "none", padding: 0, margin: 0 }}>
        <legend className="field-label">نوع تاريخ الصك</legend>
        <div className="stack-actions" style={{ marginTop: "0.35rem" }}>
          <label className="filter-chip" data-active={calendar === "gregorian"}>
            <input
              type="radio"
              name="deedCalendar"
              value="gregorian"
              checked={calendar === "gregorian"}
              onChange={() => setCalendar("gregorian")}
              required
              style={{ marginInlineEnd: "0.35rem" }}
            />
            ميلادي
          </label>
          <label className="filter-chip" data-active={calendar === "hijri"}>
            <input
              type="radio"
              name="deedCalendar"
              value="hijri"
              checked={calendar === "hijri"}
              onChange={() => setCalendar("hijri")}
              required
              style={{ marginInlineEnd: "0.35rem" }}
            />
            هجري
          </label>
        </div>
        <span className="field-hint">لازم تختار هجري أو ميلادي مع تاريخ الصك</span>
      </fieldset>

      {calendar === "gregorian" ? (
        <DatePickerField
          name="deedDate"
          label="تاريخ الصك (ميلادي)"
          defaultValue={defaultDate ?? undefined}
        />
      ) : (
        <div className="field">
          <span className="field-label">تاريخ الصك (هجري)</span>
          <input type="hidden" name="deedDate" value={hijriAsGregorian} />
          <div className="form-grid">
            <label className="field">
              <span className="field-label">اليوم</span>
              <select
                value={hd}
                onChange={(e) => setHd(Number(e.target.value))}
                required
              >
                {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">الشهر</span>
              <select
                value={hm}
                onChange={(e) => setHm(Number(e.target.value))}
                required
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {hijriMonthName(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">السنة</span>
              <select
                value={hy}
                onChange={(e) => setHy(Number(e.target.value))}
                required
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
