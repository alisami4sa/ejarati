"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createFlatAction,
  updateFlatAction,
} from "@/app/actions/flats";
import type { ActionState } from "@/app/actions/buildings";
import { FormError } from "@/components/form-error";
import { patterns } from "@/lib/validation";

type FlatDefaults = {
  flatNumber: string;
  floor?: number | null;
  rooms?: number | null;
  sizeSqm?: number | null;
  electricBoxNo?: string | null;
  licenseNo?: string | null;
};

export function FlatForm({
  mode = "create",
  buildingId,
  flatId,
  cancelHref,
  defaults,
  availableNumbers,
}: {
  mode?: "create" | "edit";
  buildingId: string;
  flatId?: string;
  cancelHref: string;
  defaults?: FlatDefaults;
  /** Unused flat numbers for this building (current number included when editing). */
  availableNumbers: string[];
}) {
  const action =
    mode === "edit" && flatId
      ? updateFlatAction.bind(null, flatId)
      : createFlatAction;

  const [state, formAction, pending] = useActionState(
    action as (state: ActionState, formData: FormData) => Promise<ActionState>,
    undefined,
  );

  const defaultNumber =
    defaults?.flatNumber && availableNumbers.includes(defaults.flatNumber)
      ? defaults.flatNumber
      : availableNumbers[0];

  return (
    <form action={formAction} className="panel" style={{ padding: "1.25rem" }}>
      {mode === "create" && (
        <input type="hidden" name="buildingId" value={buildingId} />
      )}
      <div className="form-grid">
        <label className="field">
          <span className="field-label">رقم الشقة</span>
          {availableNumbers.length === 0 ? (
            <>
              <select name="flatNumber" disabled required>
                <option value="">لا توجد أرقام متاحة</option>
              </select>
              <span className="field-hint">كل أرقام الشقق من 1 إلى 20 مستخدمة</span>
            </>
          ) : (
            <select
              name="flatNumber"
              required
              dir="ltr"
              defaultValue={defaultNumber}
            >
              {availableNumbers.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
        </label>
        <label className="field">
          <span className="field-label">الدور</span>
          <input
            name="floor"
            type="number"
            inputMode="numeric"
            min={0}
            max={200}
            defaultValue={defaults?.floor ?? undefined}
          />
        </label>
        <label className="field">
          <span className="field-label">عدد الغرف</span>
          <input
            name="rooms"
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            defaultValue={defaults?.rooms ?? undefined}
          />
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
            defaultValue={defaults?.sizeSqm ?? undefined}
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
            defaultValue={defaults?.electricBoxNo ?? ""}
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
            defaultValue={defaults?.licenseNo ?? ""}
          />
        </label>
      </div>
      <FormError message={state?.error} />
      <div className="stack-actions" style={{ marginTop: "1.25rem" }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={pending || availableNumbers.length === 0}
        >
          {pending
            ? "جارٍ الحفظ..."
            : mode === "edit"
              ? "حفظ التعديلات"
              : "حفظ الشقة"}
        </button>
        <Link href={cancelHref} className="btn btn-secondary">
          رجوع
        </Link>
      </div>
    </form>
  );
}
