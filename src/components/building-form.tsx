"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createBuildingAction } from "@/app/actions/buildings";
import { FormError } from "@/components/form-error";
import { patterns } from "@/lib/validation";

export function BuildingForm() {
  const [state, action, pending] = useActionState(createBuildingAction, undefined);

  return (
    <form action={action} className="panel" style={{ padding: "1.25rem" }}>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">اسم العمارة</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="مثال: العمارة العام"
          />
        </label>
        <label className="field">
          <span className="field-label">رقم الصك (اختياري)</span>
          <input
            name="ownerRefNumber"
            dir="ltr"
            inputMode="numeric"
            pattern={patterns.deedNumber}
            minLength={5}
            maxLength={20}
            placeholder="أرقام فقط"
            title="رقم الصك: 5 إلى 20 رقماً"
          />
        </label>
      </div>
      <FormError message={state?.error} />
      <div className="stack-actions" style={{ marginTop: "1.25rem" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : "حفظ العمارة"}
        </button>
        <Link href="/dashboard" className="btn btn-secondary">
          رجوع
        </Link>
      </div>
    </form>
  );
}
