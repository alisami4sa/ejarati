"use client";

import { useMemo, useState } from "react";
import { addYears, differenceInCalendarYears } from "date-fns";
import { DatePickerField } from "@/components/date-picker";

function parseKey(value?: string) {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    12,
  );
}

function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function inferDurationYears(start?: string, end?: string): "1" | "2" | "custom" {
  const s = parseKey(start);
  const e = parseKey(end);
  if (!s || !e) return "1";
  const years = differenceInCalendarYears(e, s);
  if (years === 1 && toKey(addYears(s, 1)) === end) return "1";
  if (years === 2 && toKey(addYears(s, 2)) === end) return "2";
  return "custom";
}

export function ContractTermFields({
  defaultStartDate,
  defaultEndDate,
}: {
  defaultStartDate?: string;
  defaultEndDate?: string;
}) {
  const [startDate, setStartDate] = useState(defaultStartDate ?? "");
  const [duration, setDuration] = useState<"1" | "2" | "custom">(() =>
    inferDurationYears(defaultStartDate, defaultEndDate),
  );
  const [customEnd, setCustomEnd] = useState(defaultEndDate ?? "");

  const computedEnd = useMemo(() => {
    const start = parseKey(startDate);
    if (!start) return "";
    if (duration === "1") return toKey(addYears(start, 1));
    if (duration === "2") return toKey(addYears(start, 2));
    return customEnd;
  }, [startDate, duration, customEnd]);

  return (
    <>
      <DatePickerField
        name="startDate"
        label="تاريخ بداية العقد"
        required
        value={startDate}
        onChange={(next) => {
          setStartDate(next);
          if (duration === "custom" && !customEnd) {
            // keep custom empty until user picks
          }
        }}
      />

      <label className="field">
        <span className="field-label">مدة العقد</span>
        <select
          value={duration}
          onChange={(e) => {
            const next = e.target.value as "1" | "2" | "custom";
            setDuration(next);
            if (next === "custom") {
              const start = parseKey(startDate);
              if (start && !customEnd) {
                setCustomEnd(toKey(addYears(start, 1)));
              }
            }
          }}
          required
        >
          <option value="1">سنة واحدة</option>
          <option value="2">سنتان</option>
          <option value="custom">تخصيص تاريخ النهاية</option>
        </select>
        <span className="field-hint">
          يحسب تاريخ النهاية تلقائياً من تاريخ البداية
        </span>
      </label>

      {duration === "custom" ? (
        <DatePickerField
          name="endDate"
          label="تاريخ نهاية العقد"
          required
          value={customEnd}
          onChange={setCustomEnd}
        />
      ) : (
        <DatePickerField
          name="endDate"
          label="تاريخ نهاية العقد"
          required
          value={computedEnd}
          readOnly
          hint={
            startDate
              ? `محسوب: بعد ${duration === "1" ? "سنة" : "سنتين"} من البداية`
              : "اختر تاريخ البداية أولاً"
          }
        />
      )}
    </>
  );
}
