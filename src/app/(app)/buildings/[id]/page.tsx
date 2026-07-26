import Link from "next/link";
import { notFound } from "next/navigation";
import { BuildingFlats, type FlatRow } from "@/components/building-flats";
import { Stat } from "@/components/stat";
import { startOfDayLocal } from "@/lib/dates";
import { formatMoney, isActiveContract } from "@/lib/format";
import { annualizeServices } from "@/lib/installments";
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
  let servicesTotal = 0;
  let occupied = 0;

  const flatRows: FlatRow[] = building.flats.map((flat) => {
    const active =
      flat.contracts.find((c) =>
        isActiveContract(c.startDate, c.endDate, c.status),
      ) ?? null;

    if (active) {
      occupied += 1;
      servicesTotal += annualizeServices(active.servicesAmount, active.servicesPeriod);
      paidYtd += sumPaidThisYear(active.installments);
      unpaid += sumUnpaidThroughYearEnd(active.installments);
    } else {
      servicesTotal += annualizeServices(flat.estimatedServices, flat.servicesPeriod);
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
      estimatedRent: flat.estimatedRent,
      estimatedServices: flat.estimatedServices,
      servicesPeriod: flat.servicesPeriod,
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
            servicesIncluded: active.servicesIncluded,
            servicesAmount: active.servicesAmount,
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
        <div>
          <p className="page-sub">
            <Link href="/dashboard">لوحة المتابعة</Link> / عمارة
          </p>
          <h1 className="page-title">{building.name}</h1>
          {building.ownerRefNumber && (
            <p className="page-sub">رقم الصك: {building.ownerRefNumber}</p>
          )}
        </div>
        <div className="stack-actions">
          <Link href={`/buildings/${building.id}/flats/new`} className="btn btn-primary">
            إضافة شقة
          </Link>
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
          hint={`دفعات ${new Date().getFullYear()} غير المدفوعة · خدمات العمارة ${formatMoney(servicesTotal)} ر.س/سنة`}
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
