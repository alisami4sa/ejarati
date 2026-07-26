"use client";

import { useState } from "react";

export function ServicesFields({
  defaultIncluded = false,
  defaultAmount = 0,
  defaultPeriod = "monthly",
}: {
  defaultIncluded?: boolean;
  defaultAmount?: number;
  defaultPeriod?: string;
}) {
  const [included, setIncluded] = useState(defaultIncluded);

  return (
    <>
      <label className="field">
        <span className="field-label">قيمة الخدمات (مياه وكهرباء)</span>
        <select
          name="servicesIncluded"
          value={included ? "yes" : "no"}
          onChange={(e) => setIncluded(e.target.value === "yes")}
        >
          <option value="yes">شامل قيمة الخدمات</option>
          <option value="no">غير شامل قيمة الخدمات</option>
        </select>
      </label>
      <label className="field">
        <span className="field-label">مبلغ الخدمات</span>
        <input
          name="servicesAmount"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          required
          defaultValue={defaultAmount}
          placeholder={included ? "0 إن لم تُحدد" : "مبلغ الخدمات"}
        />
      </label>
      <label className="field">
        <span className="field-label">دورة مبلغ الخدمات</span>
        <select name="servicesPeriod" defaultValue={defaultPeriod}>
          <option value="monthly">شهري</option>
          <option value="annual">سنوي</option>
        </select>
      </label>
    </>
  );
}
