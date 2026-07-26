"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createFlatAction } from "@/app/actions/flats";
import { FormError } from "@/components/form-error";
import { patterns } from "@/lib/validation";

export function FlatForm({
  buildingId,
  buildingHref,
}: {
  buildingId: string;
  buildingHref: string;
}) {
  const [state, action, pending] = useActionState(createFlatAction, undefined);

  return (
    <form action={action} className="panel" style={{ padding: "1.25rem" }}>
      <input type="hidden" name="buildingId" value={buildingId} />
      <div className="form-grid">
        <label className="field">
          <span className="field-label">رقم الشقة</span>
          <input
            name="flatNumber"
            required
            dir="ltr"
            inputMode="numeric"
            pattern={patterns.flatNumber}
            minLength={1}
            maxLength={10}
            placeholder="1"
            title="أرقام فقط"
          />
        </label>
        <label className="field">
          <span className="field-label">الدور</span>
          <input name="floor" type="number" inputMode="numeric" min={0} max={200} />
        </label>
        <label className="field">
          <span className="field-label">عدد الغرف</span>
          <input name="rooms" type="number" inputMode="numeric" min={1} max={20} />
        </label>
        <label className="field">
          <span className="field-label">المساحة (م²)</span>
          <input
            name="sizeSqm"
            type="number"
            inputMode="decimal"
            min={1}
            max={10000}
            step="0.1"
          />
        </label>
        <label className="field">
          <span className="field-label">رقم عداد الكهرباء</span>
          <input
            name="electricBoxNo"
            dir="ltr"
            inputMode="numeric"
            pattern={patterns.meterNumber}
            minLength={4}
            maxLength={20}
            placeholder="أرقام فقط"
            title="4 إلى 20 رقماً"
          />
        </label>
        <label className="field">
          <span className="field-label">رقم عداد الماء</span>
          <input
            name="licenseNo"
            dir="ltr"
            inputMode="numeric"
            pattern={patterns.meterNumber}
            minLength={4}
            maxLength={20}
            placeholder="أرقام فقط"
            title="4 إلى 20 رقماً"
          />
        </label>
        <label className="field">
          <span className="field-label">الإيجار التقديري (سنوي)</span>
          <input
            name="estimatedRent"
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            defaultValue={0}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">مبلغ الخدمات التقديري</span>
          <input
            name="estimatedServices"
            type="number"
            inputMode="numeric"
            min={0}
            step="1"
            defaultValue={0}
            required
          />
        </label>
        <label className="field">
          <span className="field-label">دورة الخدمات</span>
          <select name="servicesPeriod" defaultValue="monthly" required>
            <option value="monthly">شهري</option>
            <option value="annual">سنوي</option>
          </select>
        </label>
      </div>
      <FormError message={state?.error} />
      <div className="stack-actions" style={{ marginTop: "1.25rem" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : "حفظ الشقة"}
        </button>
        <Link href={buildingHref} className="btn btn-secondary">
          إلغاء
        </Link>
      </div>
    </form>
  );
}
