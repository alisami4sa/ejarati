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
  required?: boolean;
};

function parseDefaultDate(value?: string) {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  }
  return new Date(value);
}

export function DatePickerField({ name, label, defaultValue, required }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(() =>
    parseDefaultDate(defaultValue),
  );
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const value = selected ? format(selected, "yyyy-MM-dd") : "";

  return (
    <div className="field" ref={rootRef}>
      <span className="field-label">{label}</span>
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        className="date-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {value || "اختر التاريخ"}
      </button>
      {open && (
        <div className="date-popover">
          <DayPicker
            mode="single"
            locale={ar}
            dir="rtl"
            selected={selected}
            onSelect={(d) => {
              setSelected(d);
              setOpen(false);
            }}
            defaultMonth={selected}
          />
        </div>
      )}
    </div>
  );
}
