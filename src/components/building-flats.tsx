"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  dueCountdown,
  formatDate,
  formatDueLabel,
  formatMoney,
  formatRemainingLabel,
  isActiveContract,
} from "@/lib/format";

export type FlatRow = {
  id: string;
  flatNumber: string;
  estimatedRent: number;
  estimatedServices: number;
  servicesPeriod: string;
  activeContract: null | {
    id: string;
    contractNumber: string;
    tenantName: string;
    tenantMobile: string;
    endDate: string;
    status: string;
    startDate: string;
    rentAmount: number;
    servicesIncluded: boolean;
    servicesAmount: number;
    nextDue: null | {
      id: string;
      dueDate: string;
      amount: number;
      status: string;
    };
    hasOverdue: boolean;
  };
};

type Filter = "all" | "due" | "overdue" | "paid" | "empty";

export function BuildingFlats({ flats }: { flats: FlatRow[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    return flats.filter((f) => {
      if (filter === "all") return true;
      if (filter === "empty") return !f.activeContract;
      if (!f.activeContract) return false;
      if (filter === "overdue") return f.activeContract.hasOverdue;
      if (filter === "due") {
        const n = f.activeContract.nextDue;
        if (!n || n.status === "paid") return false;
        const c = dueCountdown(new Date(n.dueDate));
        return c.kind === "today" || (c.kind === "remaining" && c.days <= 14);
      }
      if (filter === "paid") {
        return (
          !!f.activeContract.nextDue && f.activeContract.nextDue.status === "paid"
        );
      }
      return true;
    });
  }, [flats, filter]);

  const chips: { id: Filter; label: string }[] = [
    { id: "all", label: "الكل" },
    { id: "due", label: "مستحق قريباً" },
    { id: "overdue", label: "متأخر" },
    { id: "empty", label: "فارغ" },
  ];

  return (
    <>
      <div className="filters">
        {chips.map((c) => (
          <button
            key={c.id}
            type="button"
            className="filter-chip"
            data-active={filter === c.id}
            onClick={() => setFilter(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="panel table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>الشقة</th>
              <th>المستأجر</th>
              <th>العقد</th>
              <th>المتبقي على العقد</th>
              <th>الإيجار / الخدمات</th>
              <th>أقرب استحقاق</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">لا توجد شقق بهذا الفلتر</div>
                </td>
              </tr>
            ) : (
              rows.map((flat) => {
                const c = flat.activeContract;
                return (
                  <tr key={flat.id}>
                    <td>
                      <div className="cell-strong">شقة {flat.flatNumber}</div>
                    </td>
                    <td>
                      {c ? (
                        <>
                          <div>{c.tenantName}</div>
                          <div className="cell-muted" dir="ltr">
                            {c.tenantMobile}
                          </div>
                        </>
                      ) : (
                        <span className="badge badge-empty">فارغة</span>
                      )}
                    </td>
                    <td>
                      {c ? (
                        isActiveContract(
                          new Date(c.startDate),
                          new Date(c.endDate),
                          c.status,
                        ) ? (
                          <span className="badge badge-ok">نشط</span>
                        ) : (
                          <span className="badge badge-muted">غير نشط</span>
                        )
                      ) : (
                        <span className="badge badge-muted">—</span>
                      )}
                      {c && (
                        <div className="cell-muted" style={{ marginTop: 4 }}>
                          {c.contractNumber}
                        </div>
                      )}
                    </td>
                    <td>
                      {c ? (
                        <span className="cell-strong">
                          {formatRemainingLabel(new Date(c.endDate))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      {c ? (
                        <>
                          <div className="cell-strong">
                            {formatMoney(c.rentAmount)} ر.س
                          </div>
                          <div className="cell-muted">
                            {c.servicesIncluded ? "شامل الخدمات" : "غير شامل"}
                            {!c.servicesIncluded && c.servicesAmount > 0
                              ? ` · ${formatMoney(c.servicesAmount)}`
                              : ""}
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="cell-strong">
                            تقديري {formatMoney(flat.estimatedRent)} ر.س
                          </div>
                          <div className="cell-muted">
                            خدمات{" "}
                            {flat.estimatedServices > 0
                              ? `${formatMoney(flat.estimatedServices)} (${flat.servicesPeriod === "annual" ? "سنوي" : "شهري"})`
                              : "—"}
                          </div>
                        </>
                      )}
                    </td>
                    <td>
                      {c?.nextDue ? (
                        <>
                          <div className="cell-strong">
                            {formatDate(c.nextDue.dueDate)}
                          </div>
                          <div
                            className={
                              dueCountdown(new Date(c.nextDue.dueDate)).kind ===
                              "overdue"
                                ? "due-overdue"
                                : dueCountdown(new Date(c.nextDue.dueDate))
                                      .kind === "today"
                                  ? "due-today"
                                  : "due-remaining"
                            }
                          >
                            {formatDueLabel(new Date(c.nextDue.dueDate))}
                          </div>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <Link href={`/flats/${flat.id}`} className="btn btn-secondary btn-sm">
                        تفاصيل
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
