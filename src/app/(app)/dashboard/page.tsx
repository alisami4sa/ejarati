import Link from "next/link";
import { Stat } from "@/components/stat";
import { formatMoney } from "@/lib/format";
import { formatDeedDate } from "@/lib/hijri";
import { getDashboardData } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData(user.id);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">لوحة المتابعة</h1>
          <p className="page-sub">عماراتك، شققك، وما دُفع وما تبقّى حتى نهاية السنة</p>
        </div>
        <div className="stack-actions">
          <Link href="/buildings/new" className="btn btn-primary">
            إضافة عمارة
          </Link>
        </div>
      </div>

      <div className="stats">
        <Stat label="عدد العمارات" value={String(data.buildingCount)} />
        <Stat label="عدد الشقق" value={String(data.flatCount)} />
        <Stat
          label="المحصّل هذه السنة"
          value={`${formatMoney(data.paidYtd)} ر.س`}
        />
        <Stat
          label="المتبقي حتى نهاية السنة"
          value={`${formatMoney(data.unpaidToYearEnd)} ر.س`}
          hint="دفعات غير محصّلة استحقاقها هذه السنة"
        />
      </div>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">العمارات</h2>
        </div>

        {data.buildings.length === 0 ? (
          <div className="panel empty-state">
            <p>لا توجد عمارات بعد. ابدأ بإضافة عمارتك الأولى.</p>
            <div style={{ marginTop: "1rem" }}>
              <Link href="/buildings/new" className="btn btn-primary">
                إضافة عمارة
              </Link>
            </div>
          </div>
        ) : (
          <div className="building-list">
            {data.buildings.map((b) => (
              <Link key={b.id} href={`/buildings/${b.id}`} className="building-row">
                <div>
                  <div className="building-name">{b.name}</div>
                  {b.ownerRefNumber && (
                    <div className="building-meta">رقم الصك: {b.ownerRefNumber}</div>
                  )}
                  {b.deedDate && (
                    <div className="building-meta">
                      تاريخ الصك: {formatDeedDate(b.deedDate, b.deedCalendar)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="cell-strong">{b.flatCount}</div>
                  <div className="cell-muted">شقة</div>
                </div>
                <div>
                  <div className="cell-strong">
                    {b.occupied} / {b.empty}
                  </div>
                  <div className="cell-muted">مؤجرة / فارغة</div>
                </div>
                <div>
                  <div className="cell-strong">{formatMoney(b.leasesYearlyTotal)} ر.س</div>
                  <div className="cell-muted">إيجارات العقود (سنوي)</div>
                </div>
                <div>
                  {b.overdue > 0 ? (
                    <span className="badge badge-warn">{b.overdue} متأخر</span>
                  ) : (
                    <span className="badge badge-ok">منتظم</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
