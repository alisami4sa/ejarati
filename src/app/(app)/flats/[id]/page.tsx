import Link from "next/link";
import { notFound } from "next/navigation";
import { endContractAction } from "@/app/actions/contracts";
import { deleteFlatAction } from "@/app/actions/flats";
import { BackButton } from "@/components/back-button";
import { DeleteButton } from "@/components/delete-button";
import { InstallmentList } from "@/components/installment-actions";
import { Stat } from "@/components/stat";
import {
  formatDate,
  formatMoney,
  formatRemainingLabel,
  isActiveContract,
} from "@/lib/format";
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

  const active =
    flat.contracts.find((c) =>
      isActiveContract(c.startDate, c.endDate, c.status),
    ) ?? flat.contracts.find((c) => c.status === "active") ?? null;

  const empty = !active || !isActiveContract(active.startDate, active.endDate, active.status);

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
            {empty ? (
              <span className="badge badge-empty">فارغة</span>
            ) : (
              <span className="badge badge-ok">مؤجرة</span>
            )}
          </p>
        </div>
        <div className="stack-actions">
          {empty && (
            <Link href={`/flats/${flat.id}/contract/new`} className="btn btn-primary">
              إضافة عقد ومستأجر
            </Link>
          )}
          <Link href={`/flats/${flat.id}/edit`} className="btn btn-secondary">
            تعديل
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
          label={empty ? "إيجار تقديري" : "مبلغ الإيجار"}
          value={`${formatMoney(empty ? flat.estimatedRent : active!.rentAmount)} ر.س`}
        />
        <Stat
          label="الخدمات"
          value={
            empty
              ? flat.estimatedServices > 0
                ? `${formatMoney(flat.estimatedServices)} ر.س`
                : "—"
              : active!.servicesIncluded
                ? "شامل"
                : `${formatMoney(active!.servicesAmount)} ر.س`
          }
          hint={
            empty
              ? flat.servicesPeriod === "annual"
                ? "سنوي"
                : "شهري"
              : active!.servicesPeriod === "annual"
                ? "سنوي"
                : "شهري"
          }
        />
        <Stat
          label="حالة العقد"
          value={
            active && isActiveContract(active.startDate, active.endDate, active.status)
              ? "نشط"
              : "غير نشط"
          }
        />
        <Stat
          label="المتبقي على العقد"
          value={
            active && isActiveContract(active.startDate, active.endDate, active.status)
              ? formatRemainingLabel(active.endDate)
              : "—"
          }
        />
      </div>

      {empty ? (
        <section className="section panel" style={{ padding: "1.25rem" }}>
          <h2 className="section-title">شقة فارغة</h2>
          <p className="page-sub" style={{ marginTop: "0.5rem" }}>
            القيمة التقديرية للإيجار{" "}
            <strong>{formatMoney(flat.estimatedRent)} ر.س</strong>
            {flat.estimatedServices > 0 && (
              <>
                {" "}
                + خدمات{" "}
                <strong>
                  {formatMoney(flat.estimatedServices)} ر.س (
                  {flat.servicesPeriod === "annual" ? "سنوي" : "شهري"})
                </strong>
              </>
            )}
          </p>
        </section>
      ) : (
        <>
          <section className="section panel" style={{ padding: "1.25rem" }}>
            <div className="section-head">
              <h2 className="section-title">بيانات العقد</h2>
              <form action={endContractAction.bind(null, active!.id)}>
                <button type="submit" className="btn btn-danger btn-sm">
                  إنهاء العقد
                </button>
              </form>
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
              <div>
                <div className="cell-muted">الخدمات</div>
                <div className="cell-strong">
                  {active!.servicesIncluded
                    ? "شامل قيمة الخدمات"
                    : `غير شامل · ${formatMoney(active!.servicesAmount)} ر.س`}
                </div>
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
    </>
  );
}
