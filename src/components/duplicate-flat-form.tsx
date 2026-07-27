"use client";

import { useActionState } from "react";
import {
  duplicateFlatAction,
  type DuplicateFlatState,
} from "@/app/actions/flats";
import { FormError } from "@/components/form-error";

export function DuplicateFlatForm({
  flatId,
  flatNumber,
  maxCount,
}: {
  flatId: string;
  flatNumber: string;
  maxCount: number;
}) {
  const [state, action, pending] = useActionState(
    duplicateFlatAction.bind(null, flatId),
    undefined as DuplicateFlatState | undefined,
  );

  if (maxCount <= 0) {
    return (
      <p className="field-hint">
        لا توجد أرقام شقق متاحة للتكرار في هذه العمارة (1–20).
      </p>
    );
  }

  const options = Array.from({ length: maxCount }, (_, i) => i + 1);

  return (
    <form action={action} className="duplicate-flat">
      <p className="page-sub" style={{ margin: 0 }}>
        ينسخ الدور والغرف والمساحة من شقة {flatNumber}، بدون أرقام عداد
        الكهرباء والماء، ويُرقّم الشقق الجديدة تلقائياً.
      </p>
      <div className="duplicate-flat-row">
        <label className="field" style={{ margin: 0, minWidth: "8rem" }}>
          <span className="field-label">عدد الشقق</span>
          <select name="count" required defaultValue={1} dir="ltr">
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={pending}
          style={{ alignSelf: "end" }}
        >
          {pending ? "جارٍ التكرار..." : "تكرار الشقة"}
        </button>
      </div>
      <FormError message={state?.error} />
    </form>
  );
}
