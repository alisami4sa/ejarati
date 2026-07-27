import { addDays } from "date-fns";
import { startOfDayLocal } from "@/lib/dates";
import {
  formatDate,
  formatMoney,
  formatRemainingLabel,
} from "@/lib/format";
import { getMailFrom, getResendClient } from "@/lib/mail";
import { prisma } from "@/lib/prisma";

const RIYADH_TZ = "Asia/Riyadh";

export type UpcomingRentReminder = {
  installmentId: string;
  amount: number;
  dueDate: Date;
  daysUntilDue: number;
  buildingName: string;
  flatNumber: string;
  tenantName: string;
  tenantMobile: string;
  contractRemaining: string;
  contractEndDate: Date;
  ownerId: string;
  ownerEmail: string;
};

/** Calendar date key (yyyy-MM-dd) in Saudi Arabia. */
export function riyadhDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RIYADH_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function riyadhTodayStart() {
  const [y, m, d] = riyadhDateKey(new Date()).split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

/**
 * Unpaid installments for active contracts whose due date is exactly
 * `daysAhead` calendar days from today (Riyadh). Default: 10.
 */
export async function getRentRemindersDueInDays(
  daysAhead = 10,
): Promise<UpcomingRentReminder[]> {
  const today = riyadhTodayStart();
  const target = startOfDayLocal(addDays(today, daysAhead));
  const targetKey = riyadhDateKey(target);

  const installments = await prisma.installment.findMany({
    where: {
      status: { not: "paid" },
      dueDate: {
        gte: addDays(target, -1),
        lte: addDays(target, 2),
      },
      contract: {
        status: "active",
      },
    },
    orderBy: { dueDate: "asc" },
    include: {
      contract: {
        include: {
          tenant: true,
          flat: {
            include: {
              building: {
                include: {
                  owner: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return installments
    .map((inst) => {
      const due = startOfDayLocal(inst.dueDate);
      if (riyadhDateKey(due) !== targetKey) return null;

      return {
        installmentId: inst.id,
        amount: inst.amount,
        dueDate: due,
        daysUntilDue: daysAhead,
        buildingName: inst.contract.flat.building.name,
        flatNumber: inst.contract.flat.flatNumber,
        tenantName: inst.contract.tenant.name,
        tenantMobile: inst.contract.tenant.mobile,
        contractRemaining: formatRemainingLabel(inst.contract.endDate),
        contractEndDate: inst.contract.endDate,
        ownerId: inst.contract.flat.building.ownerId,
        ownerEmail: inst.contract.flat.building.owner.email,
      } satisfies UpcomingRentReminder;
    })
    .filter((x): x is UpcomingRentReminder => x !== null);
}

export function buildReminderEmailHtml(
  ownerEmail: string,
  items: UpcomingRentReminder[],
  withinDays: number,
) {
  const rows = items
    .map((item) => {
      const when =
        item.daysUntilDue === 0
          ? "اليوم"
          : item.daysUntilDue === 1
            ? "غداً"
            : `بعد ${item.daysUntilDue} أيام`;
      return `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #d5ddd8;">${item.buildingName}</td>
          <td style="padding:10px;border-bottom:1px solid #d5ddd8;">شقة ${item.flatNumber}</td>
          <td style="padding:10px;border-bottom:1px solid #d5ddd8;">${item.tenantName}<br/><span style="color:#6a7a72;direction:ltr;display:inline-block;">${item.tenantMobile}</span></td>
          <td style="padding:10px;border-bottom:1px solid #d5ddd8;">${formatDate(item.dueDate)}<br/><strong>${when}</strong></td>
          <td style="padding:10px;border-bottom:1px solid #d5ddd8;"><strong>${formatMoney(item.amount)} ر.س</strong></td>
          <td style="padding:10px;border-bottom:1px solid #d5ddd8;">${item.contractRemaining}</td>
        </tr>
      `;
    })
    .join("");

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  return `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.7; color: #14201c;">
      <h2 style="color:#1f6b5c;margin:0 0 8px;">تذكير إيجارات قادمة — إجاراتي</h2>
      <p style="color:#5c6b64;margin:0 0 16px;">
        إلى ${ownerEmail}<br/>
        لديك <strong>${items.length}</strong> دفعة إيجار بعد ${withinDays} أيام
        بإجمالي <strong>${formatMoney(total)} ر.س</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f4f7f5;text-align:right;">
            <th style="padding:10px;">العمارة</th>
            <th style="padding:10px;">الشقة</th>
            <th style="padding:10px;">المستأجر</th>
            <th style="padding:10px;">الاستحقاق</th>
            <th style="padding:10px;">المبلغ</th>
            <th style="padding:10px;">متبقي العقد</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <p style="color:#6a7a72;font-size:13px;margin-top:18px;">
        تذكير تلقائي من تطبيق إجاراتي — يُرسل قبل الاستحقاق بـ ${withinDays} أيام.
      </p>
    </div>
  `;
}

export type AutoReminderResult = {
  scanned: number;
  emailsSent: number;
  skippedNoMail: boolean;
  errors: string[];
};

/** Send one email per owner for installments due in exactly `daysAhead` days. */
export async function runAutomaticRentReminders(
  daysAhead = 10,
): Promise<AutoReminderResult> {
  const resend = getResendClient();
  if (!resend) {
    return {
      scanned: 0,
      emailsSent: 0,
      skippedNoMail: true,
      errors: ["RESEND_API_KEY missing"],
    };
  }

  const items = await getRentRemindersDueInDays(daysAhead);
  const byOwner = new Map<string, UpcomingRentReminder[]>();
  for (const item of items) {
    const list = byOwner.get(item.ownerId) ?? [];
    list.push(item);
    byOwner.set(item.ownerId, list);
  }

  const errors: string[] = [];
  let emailsSent = 0;

  for (const ownerItems of byOwner.values()) {
    const email = ownerItems[0]?.ownerEmail;
    if (!email) continue;

    const { error } = await resend.emails.send({
      from: getMailFrom(),
      to: email,
      subject: `تذكير: ${ownerItems.length} إيجار بعد ${daysAhead} أيام — إجاراتي`,
      html: buildReminderEmailHtml(email, ownerItems, daysAhead),
    });

    if (error) {
      errors.push(`${email}: ${error.message || "send failed"}`);
    } else {
      emailsSent += 1;
    }
  }

  return {
    scanned: items.length,
    emailsSent,
    skippedNoMail: false,
    errors,
  };
}
