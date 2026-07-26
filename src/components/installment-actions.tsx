"use client";

import {
  markInstallmentPaidAction,
  markInstallmentUnpaidAction,
} from "@/app/actions/contracts";
import { dueCountdown, formatDate, formatDueLabel, formatMoney } from "@/lib/format";

export function InstallmentList({
  items,
}: {
  items: {
    id: string;
    dueDate: string;
    amount: number;
    status: string;
    paidAt: string | null;
  }[];
}) {
  return (
    <div className="installment-list">
      {items.map((item) => {
        const due = new Date(item.dueDate);
        const cd = dueCountdown(due);
        const paid = item.status === "paid";
        return (
          <div key={item.id} className="installment-row">
            <div>
              <div className="cell-strong">{formatDate(item.dueDate)}</div>
              {!paid && (
                <div
                  className={
                    cd.kind === "overdue"
                      ? "due-overdue"
                      : cd.kind === "today"
                        ? "due-today"
                        : "due-remaining"
                  }
                >
                  {formatDueLabel(due)}
                </div>
              )}
            </div>
            <div className="cell-strong">{formatMoney(item.amount)} ر.س</div>
            <div>
              {paid ? (
                <span className="badge badge-ok">مدفوعة</span>
              ) : cd.kind === "overdue" ? (
                <span className="badge badge-warn">متأخرة</span>
              ) : (
                <span className="badge badge-muted">معلقة</span>
              )}
            </div>
            <div>
              {paid ? (
                <form action={markInstallmentUnpaidAction.bind(null, item.id)}>
                  <button type="submit" className="btn btn-ghost btn-sm">
                    تراجع
                  </button>
                </form>
              ) : (
                <form action={markInstallmentPaidAction.bind(null, item.id)}>
                  <button type="submit" className="btn btn-primary btn-sm">
                    تأكيد الدفع
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
