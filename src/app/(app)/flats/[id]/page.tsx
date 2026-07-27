import Link from "next/link";
import { notFound } from "next/navigation";
import {
  endContractAction,
  renewContractAction,
} from "@/app/actions/contracts";
import { deleteFlatAction } from "@/app/actions/flats";
import { BackButton } from "@/components/back-button";
import { ConfirmActionButton } from "@/components/confirm-action-button";
import { DeleteButton } from "@/components/delete-button";
import { DuplicateFlatForm } from "@/components/duplicate-flat-form";
import { InstallmentList } from "@/components/installment-actions";
import { Stat } from "@/components/stat";
import {
  formatDate,
  formatMoney,
  formatRemainingLabel,
  isActiveContract,
  isEndedContract,
  isOpenContract,
} from "@/lib/format";
import { availableFlatNumbers } from "@/lib/flats";
import { getFlatDetail } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function FlatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const flat = await getFlatDetail(id, user.id);
  if (!flat) notFound();

  const freeCount = availableFlatNumbers(
    flat.building.flats.map((f) => f.flatNumber),
  ).length;

  const active =
    flat.contracts.find((c) =>
      isOpenContract(c.startDate, c.endDate, c.status),
    ) ?? null;

  const renewable =
    !active
      ? (flat.contracts.find((c) =>
          isEndedContract(c.endDate, c.status),
        ) ?? null)
      : null;

  const empty = !active;
  const inPeriod =
    !!active &&
    isActiveContract(active.startDate, active.endDate, active.status);

  return (
    <>
      <div className="page-head">
        <div className="page-head-main">
          <BackButton
            href={`/buildings/${flat.buildingId}`}
            label={`رجوع إلى ${flat.building.name}`}
          />
          <h1 className="page-title">شقة {flat.flatNumber}</h1>
          <p className="page-sub">
            {renewable ? (
              <span className="badge badge-warn">عقد منتهٍ</span>
            ) : empty ? (
              <span className="badge badge-empty">فارغة</span>
            ) : inPeriod ? (
              <span className="badge badge-ok">مؤجرة</span>
            ) : (
              <span className="badge badge-ok">عقد يبدأ لاحقاً</span>
            )}
          </p>
        </div>
        <div className="stack-actions">
          {renewable && (
            <ConfirmActionButton
              action={renewContractAction.bind(null, renewable.id)}
              label="تجديد العقد"
              confirmMessage="تجديد العقد بنفس المستأجر والسعر والمدة والدفعات؟ أي تعديل لاحق يكون بعقد جديد."
              className="btn btn-primary"
            />
          )}
          {empty && (
            <Link
              href={`/flats/${flat.id}/contract/new`}
              className={renewable ? "btn btn-secondary" : "btn btn-primary"}
            >
              {renewable ? "عقد جديد بدل التجديد" : "إضافة عقد ومستأجر"}
            </Link>
          )}
          <Link href={`/flats/${flat.id}/edit`} className="btn btn-secondary">
            تعديل الشقة
          </Link>
          <DeleteButton
            action={deleteFlatAction.bind(null, flat.id)}
            label="حذف الشقة"
            confirmMessage={`حذف شقة ${flat.flatNumber}؟ سيتم حذف عقودها ودفعاتها أيضاً.`}
          />
        </div>
      </div>

      <div className="stats">
        <Stat
          label="مبلغ الإيجار"
          value={
            empty
              ? "—"
              : `${formatMoney(active!.rentAmount)} ر.س`
          }
          hint={empty ? "يُحدد عند إضافة العقد" : "سنوي من العقد"}
        />
        <Stat
          label="حالة العقد"
          value={
            empty ? "—" : inPeriod ? "نشط" : "يبدأ لاحقاً"
          }
        />
        <Stat
          label="المتبقي على العقد"
          value={
            active ? formatRemainingLabel(active.endDate) : "—"
          }
        />
      </div>

      {empty ? (
        <section className="section panel" style={{ padding: "1.25rem" }}>
          <h2 className="section-title">
            {renewable ? "عقد منتهٍ" : "شقة فارغة"}
          </h2>
          {renewable ? (
            <div style={{ marginTop: "0.75rem" }}>
              <p className="page-sub">
                المستأجر السابق: <strong>{renewable.tenant.name}</strong>
                {" · "}
                انتهى في <strong>{formatDate(renewable.endDate)}</strong>
                {" · "}
                الإيجار كان{" "}
                <strong>{formatMoney(renewable.rentAmount)} ر.س</strong>
              </p>
              <p className="field-hint" style={{ marginTop: "0.5rem" }}>
                التجديد ينسخ نفس المواصفات والمدة والسعر. لأي تعديل استخدم «عقد
                جديد».
              </p>
              <div className="stack-actions" style={{ marginTop: "1rem" }}>
                <ConfirmActionButton
                  action={renewContractAction.bind(null, renewable.id)}
                  label="تجديد العقد"
                  confirmMessage="تجديد العقد بنفس المستأجر والسعر والمدة والدفعات؟"
                  className="btn btn-primary"
                />
                <Link
                  href={`/flats/${flat.id}/contract/new`}
                  className="btn btn-secondary"
                >
                  عقد جديد
                </Link>
              </div>
            </div>
          ) : (
            <p className="page-sub" style={{ marginTop: "0.5rem" }}>
              أضف عقداً ومستأجراً لتحديد مبلغ الإيجار والدفعات.
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="section panel" style={{ padding: "1.25rem" }}>
            <div className="section-head">
              <h2 className="section-title">بيانات العقد</h2>
              <div className="stack-actions">
                <Link
                  href={`/flats/${flat.id}/contract/edit`}
                  className="btn btn-secondary btn-sm"
                >
                  تعديل العقد
                </Link>
                <form action={endContractAction.bind(null, active!.id)}>
                  <button type="submit" className="btn btn-danger btn-sm">
                    إنهاء العقد
                  </button>
                </form>
              </div>
            </div>
            <div className="form-grid" style={{ marginTop: "0.75rem" }}>
              <div>
                <div className="cell-muted">المستأجر</div>
                <div className="cell-strong">{active!.tenant.name}</div>
              </div>
              <div>
                <div className="cell-muted">الجوال</div>
                <div className="cell-strong" dir="ltr">
                  {active!.tenant.mobile}
                </div>
              </div>
              <div>
                <div className="cell-muted">رقم العقد</div>
                <div className="cell-strong">{active!.contractNumber}</div>
              </div>
              <div>
                <div className="cell-muted">المدة</div>
                <div className="cell-strong">
                  {formatDate(active!.startDate)} → {formatDate(active!.endDate)}
                </div>
              </div>
              <div>
                <div className="cell-muted">عدد الدفعات</div>
                <div className="cell-strong">{active!.installmentCount}</div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">الدفعات</h2>
            </div>
            <InstallmentList
              items={active!.installments.map((i) => ({
                id: i.id,
                dueDate: i.dueDate.toISOString(),
                amount: i.amount,
                status: i.status,
                paidAt: i.paidAt ? i.paidAt.toISOString() : null,
              }))}
            />
          </section>
        </>
      )}

      <section className="section panel" style={{ padding: "1.25rem" }}>
        <h2 className="section-title">تفاصيل الشقة</h2>
        <div className="form-grid" style={{ marginTop: "0.75rem" }}>
          <div>
            <div className="cell-muted">الدور</div>
            <div>{flat.floor ?? "—"}</div>
          </div>
          <div>
            <div className="cell-muted">الغرف</div>
            <div>{flat.rooms ?? "—"}</div>
          </div>
          <div>
            <div className="cell-muted">المساحة</div>
            <div>{flat.sizeSqm ? `${flat.sizeSqm} م²` : "—"}</div>
          </div>
          <div>
            <div className="cell-muted">عداد الكهرباء</div>
            <div>{flat.electricBoxNo ?? "—"}</div>
          </div>
          <div>
            <div className="cell-muted">عداد الماء</div>
            <div>{flat.licenseNo ?? "—"}</div>
          </div>
        </div>
      </section>

      <section className="section panel" style={{ padding: "1.25rem" }}>
        <h2 className="section-title">تكرار الشقة</h2>
        <div style={{ marginTop: "0.75rem" }}>
          <DuplicateFlatForm
            flatId={flat.id}
            flatNumber={flat.flatNumber}
            maxCount={freeCount}
          />
        </div>
      </section>
    </>
  );
}
