"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  createContractAction,
  updateContractAction,
} from "@/app/actions/contracts";
import type { ActionState } from "@/app/actions/buildings";
import { ContractTermFields } from "@/components/contract-term-fields";
import { FormError } from "@/components/form-error";
import { patterns } from "@/lib/validation";

export type ContractFormDefaults = {
  tenantName: string;
  tenantMobile: string;
  tenantNationalId?: string | null;
  contractNumber: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  installmentCount: number;
};

export function ContractForm({
  mode = "create",
  flatId,
  contractId,
  flatHref,
  defaults,
  defaultRent,
}: {
  mode?: "create" | "edit";
  flatId: string;
  contractId?: string;
  flatHref: string;
  defaults?: ContractFormDefaults;
  defaultRent?: number;
}) {
  const action =
    mode === "edit" && contractId
      ? updateContractAction.bind(null, contractId)
      : createContractAction;

  const [state, formAction, pending] = useActionState(
    action as (state: ActionState, formData: FormData) => Promise<ActionState>,
    undefined,
  );

  const rentDefault =
    defaults?.rentAmount ??
    (defaultRent != null ? Math.round(defaultRent) : undefined);

  return (
    <form action={formAction} className="panel" style={{ padding: "1.25rem" }}>
      {mode === "create" && (
        <input type="hidden" name="flatId" value={flatId} />
      )}
      <div className="form-grid">
        <label className="field">
          <span className="field-label">اسم المستأجر</span>
          <input
            name="tenantName"
            required
            minLength={2}
            maxLength={80}
            defaultValue={defaults?.tenantName}
          />
        </label>
        <label className="field">
          <span className="field-label">جوال المستأجر</span>
          <input
            name="tenantMobile"
            required
            dir="ltr"
            inputMode="numeric"
            pattern={patterns.saudiMobile}
            minLength={10}
            maxLength={10}
            placeholder="0512345678"
            title="10 أرقام تبدأ بـ 05"
            defaultValue={defaults?.tenantMobile}
          />
          <span className="field-hint">مثال: 0512345678</span>
        </label>
        <label className="field">
          <span className="field-label">رقم الهوية (اختياري)</span>
          <input
            name="tenantNationalId"
            dir="ltr"
            inputMode="numeric"
            pattern={patterns.saudiNationalId}
            minLength={10}
            maxLength={10}
            placeholder="1xxxxxxxxx"
            title="10 أرقام تبدأ بـ 1 أو 2"
            defaultValue={defaults?.tenantNationalId ?? ""}
          />
        </label>
        <label className="field">
          <span className="field-label">رقم العقد</span>
          <input
            name="contractNumber"
            required
            dir="ltr"
            inputMode="numeric"
            pattern={patterns.contractNumber}
            minLength={11}
            maxLength={11}
            placeholder="11 رقماً"
            title="رقم العقد 11 رقماً"
            defaultValue={defaults?.contractNumber}
          />
        </label>

        <ContractTermFields
          defaultStartDate={defaults?.startDate}
          defaultEndDate={defaults?.endDate}
        />

        <label className="field">
          <span className="field-label">مبلغ الإيجار (سنوي كامل)</span>
          <input
            name="rentAmount"
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            required
            defaultValue={rentDefault}
          />
          <span className="field-hint">
            عند التعديل تُحدَّث تواريخ ومبالغ الدفعات غير المدفوعة تلقائياً
          </span>
        </label>
        <label className="field">
          <span className="field-label">عدد الدفعات</span>
          <select
            name="installmentCount"
            defaultValue={String(defaults?.installmentCount ?? 4)}
            required
          >
            <option value="12">12 — شهري</option>
            <option value="4">4 — ربع سنوي</option>
            <option value="3">3 — كل أربعة أشهر</option>
            <option value="2">2 — نصف سنوي</option>
            <option value="1">1 — سنوي</option>
          </select>
        </label>
      </div>

      <FormError message={state?.error} />

      <div className="stack-actions" style={{ marginTop: "1.25rem" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending
            ? "جارٍ الحفظ..."
            : mode === "edit"
              ? "حفظ تعديلات العقد"
              : "حفظ العقد وتوليد الدفعات"}
        </button>
        <Link href={flatHref} className="btn btn-secondary">
          رجوع
        </Link>
      </div>
    </form>
  );
}
