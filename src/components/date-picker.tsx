"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ar } from "react-day-picker/locale";
import { format } from "date-fns";
import "react-day-picker/style.css";

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  /** Controlled value (yyyy-MM-dd). */
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  /** Show date without opening the calendar. */
  readOnly?: boolean;
  hint?: string;
};

function parseDefaultDate(value?: string) {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      12,
    );
  }
  return new Date(value);
}

function toKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

export function DatePickerField({
  name,
  label,
  defaultValue,
  value,
  onChange,
  required,
  readOnly,
  hint,
}: Props) {
  const controlled = value !== undefined;
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState<Date | undefined>(() =>
    parseDefaultDate(defaultValue),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = controlled ? parseDefaultDate(value) : internal;
  const display = selected ? toKey(selected) : "";

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function selectDate(d: Date | undefined) {
    if (!d) return;
    if (!controlled) setInternal(d);
    onChange?.(toKey(d));
    setOpen(false);
  }

  return (
    <div className="field" ref={rootRef}>
      <span className="field-label">{label}</span>
      <input type="hidden" name={name} value={display} required={required} />
      {readOnly ? (
        <div className="date-trigger" aria-readonly="true">
          {display || "—"}
        </div>
      ) : (
        <button
          type="button"
          className="date-trigger"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {display || "اختر التاريخ"}
        </button>
      )}
      {hint && <span className="field-hint">{hint}</span>}
      {open && !readOnly && (
        <div className="date-popover">
          <DayPicker
            mode="single"
            locale={ar}
            dir="rtl"
            selected={selected}
            onSelect={selectDate}
            defaultMonth={selected}
          />
        </div>
      )}
    </div>
  );
}
