import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteBuildingAction } from "@/app/actions/buildings";
import { BackButton } from "@/components/back-button";
import { BuildingFlats, type FlatRow } from "@/components/building-flats";
import { DeleteButton } from "@/components/delete-button";
import { Stat } from "@/components/stat";
import { startOfDayLocal } from "@/lib/dates";
import { formatMoney, isOpenContract } from "@/lib/format";
import { formatDeedDate } from "@/lib/hijri";
import { sumPaidThisYear, sumUnpaidThroughYearEnd } from "@/lib/payments";
import { getBuildingDetail } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const building = await getBuildingDetail(id, user.id);
  if (!building) notFound();

  const today = startOfDayLocal(new Date());

  let paidYtd = 0;
  let unpaid = 0;
  let occupied = 0;

  const flatRows: FlatRow[] = building.flats.map((flat) => {
    const active =
      flat.contracts.find((c) =>
        isOpenContract(c.startDate, c.endDate, c.status),
      ) ?? null;

    if (active) {
      occupied += 1;
      paidYtd += sumPaidThisYear(active.installments);
      unpaid += sumUnpaidThroughYearEnd(active.installments);
    }

    const unpaidInstallments =
      active?.installments.filter((i) => i.status !== "paid") ?? [];
    const nextDue =
      unpaidInstallments.sort(
        (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
      )[0] ?? null;
    const hasOverdue = unpaidInstallments.some(
      (i) => startOfDayLocal(i.dueDate) < today,
    );

    return {
      id: flat.id,
      flatNumber: flat.flatNumber,
      activeContract: active
        ? {
            id: active.id,
            contractNumber: active.contractNumber,
            tenantName: active.tenant.name,
            tenantMobile: active.tenant.mobile,
            startDate: active.startDate.toISOString(),
            endDate: active.endDate.toISOString(),
            status: active.status,
            rentAmount: active.rentAmount,
            hasOverdue,
            nextDue: nextDue
              ? {
                  id: nextDue.id,
                  dueDate: nextDue.dueDate.toISOString(),
                  amount: nextDue.amount,
                  status: nextDue.status,
                }
              : null,
          }
        : null,
    };
  });

  return (
    <>
      <div className="page-head">
        <div className="page-head-main">
          <BackButton href="/dashboard" label="رجوع للوحة" />
          <h1 className="page-title">{building.name}</h1>
          {building.ownerRefNumber && (
            <p className="page-sub">رقم الصك: {building.ownerRefNumber}</p>
          )}
          {building.deedDate && (
            <p className="page-sub">
              تاريخ الصك:{" "}
              {formatDeedDate(building.deedDate, building.deedCalendar)}
            </p>
          )}
        </div>
        <div className="stack-actions">
          <Link href={`/buildings/${building.id}/flats/new`} className="btn btn-primary">
            إضافة شقة
          </Link>
          <Link href={`/buildings/${building.id}/edit`} className="btn btn-secondary">
            تعديل
          </Link>
          <DeleteButton
            action={deleteBuildingAction.bind(null, building.id)}
            label="حذف العمارة"
            confirmMessage={`حذف عمارة "${building.name}"؟ سيتم حذف كل الشقق والعقود والدفعات المرتبطة بها.`}
          />
        </div>
      </div>

      <div className="stats">
        <Stat label="عدد الشقق" value={String(building.flats.length)} />
        <Stat
          label="مؤجرة / فارغة"
          value={`${occupied} / ${building.flats.length - occupied}`}
        />
        <Stat
          label="المحصّل هذه السنة"
          value={`${formatMoney(paidYtd)} ر.س`}
        />
        <Stat
          label="المتبقي حتى نهاية السنة"
          value={`${formatMoney(unpaid)} ر.س`}
          hint={`دفعات ${new Date().getFullYear()} غير المدفوعة`}
        />
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">الشقق والمستأجرون</h2>
        </div>
        {building.flats.length === 0 ? (
          <div className="panel empty-state">
            <p>لا توجد شقق بعد في هذه العمارة.</p>
            <div style={{ marginTop: "1rem" }}>
              <Link
                href={`/buildings/${building.id}/flats/new`}
                className="btn btn-primary"
              >
                إضافة شقة
              </Link>
            </div>
          </div>
        ) : (
          <BuildingFlats flats={flatRows} />
        )}
      </section>
    </>
  );
}
