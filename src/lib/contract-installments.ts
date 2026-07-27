import type { Prisma } from "@prisma/client";
import {
  generateInstallmentDates,
  splitRentInstallments,
} from "@/lib/installments";

type Tx = Prisma.TransactionClient;

/** Align installment rows with a new start date / rent / count. Keeps paid status. */
export async function syncContractInstallments(
  tx: Tx,
  contractId: string,
  startDate: Date,
  rentAmount: number,
  installmentCount: number,
) {
  const existing = await tx.installment.findMany({
    where: { contractId },
    orderBy: { dueDate: "asc" },
  });
  const dates = generateInstallmentDates(startDate, installmentCount);
  const amounts = splitRentInstallments(rentAmount, installmentCount);

  for (let i = 0; i < dates.length; i++) {
    const prev = existing[i];
    const dueDate = dates[i]!;
    const amount = amounts[i] ?? 0;
    if (prev) {
      await tx.installment.update({
        where: { id: prev.id },
        data: { dueDate, amount },
      });
    } else {
      await tx.installment.create({
        data: {
          contractId,
          dueDate,
          amount,
          status: "pending",
        },
      });
    }
  }

  for (let i = dates.length; i < existing.length; i++) {
    const extra = existing[i]!;
    if (extra.status !== "paid") {
      await tx.installment.delete({ where: { id: extra.id } });
    }
  }
}
