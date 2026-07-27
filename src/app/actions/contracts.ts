"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/app/actions/buildings";
import { syncContractInstallments } from "@/lib/contract-installments";
import { nextContractTerm, parseDateInput } from "@/lib/dates";
import { isEndedContract, isOpenContract } from "@/lib/format";
import {
  generateInstallmentDates,
  splitRentInstallments,
} from "@/lib/installments";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  contractNumberSchema,
  firstZodError,
  moneySchema,
  personNameSchema,
  saudiMobileSchema,
  saudiNationalIdSchema,
} from "@/lib/validation";

const contractSchema = z.object({
  flatId: z.string().min(1).optional(),
  tenantName: personNameSchema,
  tenantMobile: saudiMobileSchema,
  tenantNationalId: saudiNationalIdSchema,
  contractNumber: contractNumberSchema,
  startDate: z.string().min(1, "اختر تاريخ بداية العقد"),
  endDate: z.string().min(1, "اختر تاريخ نهاية العقد"),
  rentAmount: moneySchema("مبلغ الإيجار", { min: 1 }),
  installmentCount: z.coerce
    .number()
    .int()
    .refine((v) => [1, 2, 3, 4, 12].includes(v), {
      message: "عدد الدفعات غير صالح",
    }),
});

function parseContractForm(formData: FormData, withFlatId: boolean) {
  return {
    ...(withFlatId ? { flatId: String(formData.get("flatId") || "") } : {}),
    tenantName: formData.get("tenantName"),
    tenantMobile: formData.get("tenantMobile"),
    tenantNationalId: String(formData.get("tenantNationalId") ?? ""),
    contractNumber: formData.get("contractNumber"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rentAmount: formData.get("rentAmount"),
    installmentCount: formData.get("installmentCount"),
  };
}

function parseContractDates(startRaw: string, endRaw: string) {
  const startDate = parseDateInput(startRaw);
  const endDate = parseDateInput(endRaw);
  if (endDate.getTime() <= startDate.getTime()) {
    throw new Error("END_BEFORE_START");
  }
  return { startDate, endDate };
}

export async function createContractAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = contractSchema
    .extend({ flatId: z.string().min(1) })
    .safeParse(parseContractForm(formData, true));

  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const flat = await prisma.flat.findFirst({
    where: { id: parsed.data.flatId, building: { ownerId: user.id } },
  });
  if (!flat) return { error: "الشقة غير موجودة" };

  let startDate: Date;
  let endDate: Date;
  try {
    ({ startDate, endDate } = parseContractDates(
      parsed.data.startDate,
      parsed.data.endDate,
    ));
  } catch (e) {
    if (e instanceof Error && e.message === "END_BEFORE_START") {
      return { error: "تاريخ النهاية يجب أن يكون بعد البداية" };
    }
    return { error: "التواريخ غير صالحة — اخترها من التقويم" };
  }

  try {
    const active = await prisma.contract.findFirst({
      where: { flatId: flat.id, status: "active" },
    });
    if (active) {
      await prisma.contract.update({
        where: { id: active.id },
        data: { status: "inactive" },
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        ownerId: user.id,
        name: parsed.data.tenantName,
        mobile: parsed.data.tenantMobile,
        nationalId: parsed.data.tenantNationalId || null,
      },
    });

    const dates = generateInstallmentDates(
      startDate,
      parsed.data.installmentCount,
    );
    const amounts = splitRentInstallments(
      parsed.data.rentAmount,
      parsed.data.installmentCount,
    );

    const contract = await prisma.contract.create({
      data: {
        flatId: flat.id,
        tenantId: tenant.id,
        contractNumber: parsed.data.contractNumber,
        startDate,
        endDate,
        rentAmount: parsed.data.rentAmount,
        installmentCount: parsed.data.installmentCount,
        status: "active",
        installments: {
          create: dates.map((dueDate, i) => ({
            dueDate,
            amount: amounts[i] ?? 0,
            status: "pending",
          })),
        },
      },
    });

    revalidatePath(`/flats/${flat.id}`);
    revalidatePath(`/buildings/${flat.buildingId}`);
    revalidatePath("/dashboard");
    redirect(`/flats/${flat.id}?contract=${contract.id}`);
  } catch (error) {
    unstable_rethrow(error);
    return { error: "تعذر حفظ العقد. حاول مرة أخرى" };
  }
}

export async function updateContractAction(
  contractId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const existing = await prisma.contract.findFirst({
    where: { id: contractId, flat: { building: { ownerId: user.id } } },
    include: { flat: true, tenant: true },
  });
  if (!existing) return { error: "العقد غير موجود" };
  if (existing.status !== "active") {
    return { error: "لا يمكن تعديل عقد منتهٍ" };
  }

  const parsed = contractSchema.safeParse(parseContractForm(formData, false));
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  let startDate: Date;
  let endDate: Date;
  try {
    ({ startDate, endDate } = parseContractDates(
      parsed.data.startDate,
      parsed.data.endDate,
    ));
  } catch (e) {
    if (e instanceof Error && e.message === "END_BEFORE_START") {
      return { error: "تاريخ النهاية يجب أن يكون بعد البداية" };
    }
    return { error: "التواريخ غير صالحة — اخترها من التقويم" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id: existing.tenantId },
        data: {
          name: parsed.data.tenantName,
          mobile: parsed.data.tenantMobile,
          nationalId: parsed.data.tenantNationalId || null,
        },
      });

      await tx.contract.update({
        where: { id: contractId },
        data: {
          contractNumber: parsed.data.contractNumber,
          startDate,
          endDate,
          rentAmount: parsed.data.rentAmount,
          installmentCount: parsed.data.installmentCount,
        },
      });

      await syncContractInstallments(
        tx,
        contractId,
        startDate,
        parsed.data.rentAmount,
        parsed.data.installmentCount,
      );
    });

    revalidatePath(`/flats/${existing.flatId}`);
    revalidatePath(`/buildings/${existing.flat.buildingId}`);
    revalidatePath("/dashboard");
    redirect(`/flats/${existing.flatId}`);
  } catch (error) {
    unstable_rethrow(error);
    return { error: "تعذر تعديل العقد. حاول مرة أخرى" };
  }
}

export async function markInstallmentPaidAction(installmentId: string) {
  const user = await requireUser();
  const installment = await prisma.installment.findFirst({
    where: {
      id: installmentId,
      contract: { flat: { building: { ownerId: user.id } } },
    },
    include: { contract: { include: { flat: true } } },
  });
  if (!installment) throw new Error("الدفعة غير موجودة");

  await prisma.installment.update({
    where: { id: installmentId },
    data: { status: "paid", paidAt: new Date() },
  });

  revalidatePath(`/flats/${installment.contract.flatId}`);
}

export async function markInstallmentUnpaidAction(installmentId: string) {
  const user = await requireUser();
  const installment = await prisma.installment.findFirst({
    where: {
      id: installmentId,
      contract: { flat: { building: { ownerId: user.id } } },
    },
    include: { contract: { include: { flat: true } } },
  });
  if (!installment) throw new Error("الدفعة غير موجودة");

  await prisma.installment.update({
    where: { id: installmentId },
    data: { status: "pending", paidAt: null },
  });

  revalidatePath(`/flats/${installment.contract.flatId}`);
}

export async function endContractAction(contractId: string) {
  const user = await requireUser();
  const contract = await prisma.contract.findFirst({
    where: { id: contractId, flat: { building: { ownerId: user.id } } },
    include: { flat: true },
  });
  if (!contract) throw new Error("العقد غير موجود");

  await prisma.contract.update({
    where: { id: contractId },
    data: { status: "inactive" },
  });

  revalidatePath(`/flats/${contract.flatId}`);
  revalidatePath(`/buildings/${contract.flat.buildingId}`);
  revalidatePath("/dashboard");
}

/**
 * Renew an ended contract with the same tenant, rent, installment count,
 * and duration. For any change, the owner should create a new contract.
 */
export async function renewContractAction(contractId: string) {
  const user = await requireUser();
  const previous = await prisma.contract.findFirst({
    where: { id: contractId, flat: { building: { ownerId: user.id } } },
    include: { flat: true, tenant: true },
  });
  if (!previous) throw new Error("العقد غير موجود");

  if (!isEndedContract(previous.endDate, previous.status)) {
    throw new Error("لا يمكن التجديد قبل انتهاء العقد الحالي");
  }

  const siblings = await prisma.contract.findMany({
    where: { flatId: previous.flatId, status: "active" },
  });
  if (
    siblings.some(
      (c) =>
        c.id !== previous.id &&
        isOpenContract(c.startDate, c.endDate, c.status),
    )
  ) {
    throw new Error("يوجد عقد ساري على هذه الشقة");
  }

  const term = nextContractTerm(previous.startDate, previous.endDate);
  const dates = generateInstallmentDates(term.startDate, previous.installmentCount);
  const amounts = splitRentInstallments(
    previous.rentAmount,
    previous.installmentCount,
  );

  try {
    await prisma.contract.updateMany({
      where: { flatId: previous.flatId, status: "active" },
      data: { status: "inactive" },
    });

    const renewed = await prisma.contract.create({
      data: {
        flatId: previous.flatId,
        tenantId: previous.tenantId,
        contractNumber: previous.contractNumber,
        startDate: term.startDate,
        endDate: term.endDate,
        rentAmount: previous.rentAmount,
        installmentCount: previous.installmentCount,
        status: "active",
        installments: {
          create: dates.map((dueDate, i) => ({
            dueDate,
            amount: amounts[i] ?? 0,
            status: "pending",
          })),
        },
      },
    });

    revalidatePath(`/flats/${previous.flatId}`);
    revalidatePath(`/buildings/${previous.flat.buildingId}`);
    revalidatePath("/dashboard");
    redirect(`/flats/${previous.flatId}?contract=${renewed.id}`);
  } catch (error) {
    unstable_rethrow(error);
    throw error;
  }
}
