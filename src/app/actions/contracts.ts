"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/app/actions/buildings";
import { parseDateInput } from "@/lib/dates";
import {
  generateInstallmentDates,
  installmentAmount,
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
  flatId: z.string().min(1),
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
  servicesIncluded: z.enum(["yes", "no"]),
  servicesAmount: moneySchema("مبلغ الخدمات", { min: 0 }),
  servicesPeriod: z.enum(["monthly", "annual"]),
});

export async function createContractAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = contractSchema.safeParse({
    flatId: formData.get("flatId"),
    tenantName: formData.get("tenantName"),
    tenantMobile: formData.get("tenantMobile"),
    tenantNationalId: String(formData.get("tenantNationalId") ?? ""),
    contractNumber: formData.get("contractNumber"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
    rentAmount: formData.get("rentAmount"),
    installmentCount: formData.get("installmentCount"),
    servicesIncluded: formData.get("servicesIncluded") === "yes" ? "yes" : "no",
    servicesAmount: formData.get("servicesAmount") || 0,
    servicesPeriod: formData.get("servicesPeriod") || "monthly",
  });

  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const flat = await prisma.flat.findFirst({
    where: { id: parsed.data.flatId, building: { ownerId: user.id } },
  });
  if (!flat) return { error: "الشقة غير موجودة" };

  let startDate: Date;
  let endDate: Date;
  try {
    startDate = parseDateInput(parsed.data.startDate);
    endDate = parseDateInput(parsed.data.endDate);
  } catch {
    return { error: "التواريخ غير صالحة — اخترها من التقويم" };
  }

  if (endDate.getTime() <= startDate.getTime()) {
    return { error: "تاريخ النهاية يجب أن يكون بعد البداية" };
  }

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

  const amount = installmentAmount(
    parsed.data.rentAmount,
    parsed.data.installmentCount,
  );
  const dates = generateInstallmentDates(startDate, parsed.data.installmentCount);

  const contract = await prisma.contract.create({
    data: {
      flatId: flat.id,
      tenantId: tenant.id,
      contractNumber: parsed.data.contractNumber,
      startDate,
      endDate,
      rentAmount: parsed.data.rentAmount,
      installmentCount: parsed.data.installmentCount,
      servicesIncluded: parsed.data.servicesIncluded === "yes",
      servicesAmount: parsed.data.servicesAmount,
      servicesPeriod: parsed.data.servicesPeriod,
      status: "active",
      installments: {
        create: dates.map((dueDate) => ({
          dueDate,
          amount,
          status: "pending",
        })),
      },
    },
  });

  revalidatePath(`/flats/${flat.id}`);
  revalidatePath(`/buildings/${flat.buildingId}`);
  revalidatePath("/dashboard");
  redirect(`/flats/${flat.id}?contract=${contract.id}`);
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
  revalidatePath(`/buildings/${installment.contract.flat.buildingId}`);
  revalidatePath("/dashboard");
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
  revalidatePath(`/buildings/${installment.contract.flat.buildingId}`);
  revalidatePath("/dashboard");
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
