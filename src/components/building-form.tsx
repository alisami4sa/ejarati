"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createBuildingAction,
  updateBuildingAction,
  type ActionState,
} from "@/app/actions/buildings";
import { DeedDateField } from "@/components/deed-date-field";
import { FormError } from "@/components/form-error";
import type { CalendarType } from "@/lib/hijri";
import { patterns } from "@/lib/validation";

type BuildingDefaults = {
  name: string;
  ownerRefNumber?: string | null;
  deedDate?: string | null;
  deedCalendar?: CalendarType | null;
};

export function BuildingForm({
  mode = "create",
  buildingId,
  defaults,
  cancelHref = "/dashboard",
}: {
  mode?: "create" | "edit";
  buildingId?: string;
  defaults?: BuildingDefaults;
  cancelHref?: string;
}) {
  const action =
    mode === "edit" && buildingId
      ? updateBuildingAction.bind(null, buildingId)
      : createBuildingAction;

  const [state, formAction, pending] = useActionState(
    action as (state: ActionState, formData: FormData) => Promise<ActionState>,
    undefined,
  );

  return (
    <form action={formAction} className="panel" style={{ padding: "1.25rem" }}>
      <div className="form-grid">
        <label className="field">
          <span className="field-label">اسم العمارة</span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="مثال: العمارة العام"
            defaultValue={defaults?.name}
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
            defaultValue={defaults?.ownerRefNumber ?? ""}
          />
        </label>
        <DeedDateField
          defaultCalendar={defaults?.deedCalendar}
          defaultDate={defaults?.deedDate}
        />
      </div>
      <FormError message={state?.error} />
      <div className="stack-actions" style={{ marginTop: "1.25rem" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending
            ? "جارٍ الحفظ..."
            : mode === "edit"
              ? "حفظ التعديلات"
              : "حفظ العمارة"}
        </button>
        <Link href={cancelHref} className="btn btn-secondary">
          رجوع
        </Link>
      </div>
    </form>
  );
}
