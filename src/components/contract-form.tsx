"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createContractAction } from "@/app/actions/contracts";
import { DatePickerField } from "@/components/date-picker";
import { FormError } from "@/components/form-error";
import { ServicesFields } from "@/components/services-toggle";
import { patterns } from "@/lib/validation";

export function ContractForm({
  flatId,
  flatHref,
  defaultRent,
  defaultServices,
  defaultServicesPeriod,
}: {
  flatId: string;
  flatHref: string;
  defaultRent?: number;
  defaultServices?: number;
  defaultServicesPeriod?: string;
}) {
  const [state, action, pending] = useActionState(createContractAction, undefined);

  return (
    <form action={action} className="panel" style={{ padding: "1.25rem" }}>
      <input type="hidden" name="flatId" value={flatId} />
      <div className="form-grid">
        <label className="field">
          <span className="field-label">اسم المستأجر</span>
          <input name="tenantName" required minLength={2} maxLength={80} />
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
          />
        </label>

        <DatePickerField name="startDate" label="تاريخ بداية العقد" required />
        <DatePickerField name="endDate" label="تاريخ نهاية العقد" required />

        <label className="field">
          <span className="field-label">مبلغ الإيجار (سنوي)</span>
          <input
            name="rentAmount"
            type="number"
            inputMode="numeric"
            min={1}
            step="1"
            required
            defaultValue={defaultRent || undefined}
          />
        </label>
        <label className="field">
          <span className="field-label">عدد الدفعات</span>
          <select name="installmentCount" defaultValue="4" required>
            <option value="12">12 — شهري</option>
            <option value="4">4 — ربع سنوي</option>
            <option value="3">3 — كل أربعة أشهر</option>
            <option value="2">2 — نصف سنوي</option>
            <option value="1">1 — سنوي</option>
          </select>
        </label>

        <ServicesFields
          defaultAmount={defaultServices}
          defaultPeriod={defaultServicesPeriod}
        />
      </div>

      <FormError message={state?.error} />

      <div className="stack-actions" style={{ marginTop: "1.25rem" }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : "حفظ العقد وتوليد الدفعات"}
        </button>
        <Link href={flatHref} className="btn btn-secondary">
          رجوع
        </Link>
      </div>
    </form>
  );
}
