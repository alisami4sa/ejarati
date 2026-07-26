"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/app/actions/buildings";
import {
  firstZodError,
  flatNumberSchema,
  meterNumberSchema,
  moneySchema,
  optionalFloatSchema,
  optionalIntSchema,
} from "@/lib/validation";

const flatSchema = z.object({
  buildingId: z.string().min(1),
  flatNumber: flatNumberSchema,
  floor: optionalIntSchema("الدور", 0, 200),
  rooms: optionalIntSchema("عدد الغرف", 1, 20),
  sizeSqm: optionalFloatSchema("المساحة", 1, 10000),
  electricBoxNo: meterNumberSchema,
  licenseNo: meterNumberSchema,
  estimatedRent: moneySchema("الإيجار التقديري", { min: 0 }),
  estimatedServices: moneySchema("مبلغ الخدمات", { min: 0 }),
  servicesPeriod: z.enum(["monthly", "annual"]),
});

async function assertBuilding(buildingId: string, ownerId: string) {
  const building = await prisma.building.findFirst({
    where: { id: buildingId, ownerId },
  });
  if (!building) throw new Error("العمارة غير موجودة");
  return building;
}

export async function createFlatAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = flatSchema.safeParse({
    buildingId: formData.get("buildingId"),
    flatNumber: formData.get("flatNumber"),
    floor: formData.get("floor"),
    rooms: formData.get("rooms"),
    sizeSqm: formData.get("sizeSqm"),
    electricBoxNo: String(formData.get("electricBoxNo") ?? ""),
    licenseNo: String(formData.get("licenseNo") ?? ""),
    estimatedRent: formData.get("estimatedRent") || 0,
    estimatedServices: formData.get("estimatedServices") || 0,
    servicesPeriod: formData.get("servicesPeriod") || "monthly",
  });

  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await assertBuilding(parsed.data.buildingId, user.id);

  const flat = await prisma.flat.create({
    data: {
      buildingId: parsed.data.buildingId,
      flatNumber: parsed.data.flatNumber,
      floor: parsed.data.floor,
      rooms: parsed.data.rooms,
      sizeSqm: parsed.data.sizeSqm,
      electricBoxNo: parsed.data.electricBoxNo || null,
      licenseNo: parsed.data.licenseNo || null,
      estimatedRent: parsed.data.estimatedRent,
      estimatedServices: parsed.data.estimatedServices,
      servicesPeriod: parsed.data.servicesPeriod,
    },
  });

  revalidatePath(`/buildings/${parsed.data.buildingId}`);
  revalidatePath("/dashboard");
  redirect(`/flats/${flat.id}`);
}

export async function updateFlatAction(flatId: string, formData: FormData) {
  const user = await requireUser();
  const flat = await prisma.flat.findFirst({
    where: { id: flatId, building: { ownerId: user.id } },
  });
  if (!flat) throw new Error("الشقة غير موجودة");

  const parsed = flatSchema.omit({ buildingId: true }).safeParse({
    flatNumber: formData.get("flatNumber"),
    floor: formData.get("floor"),
    rooms: formData.get("rooms"),
    sizeSqm: formData.get("sizeSqm"),
    electricBoxNo: String(formData.get("electricBoxNo") ?? ""),
    licenseNo: String(formData.get("licenseNo") ?? ""),
    estimatedRent: formData.get("estimatedRent") || 0,
    estimatedServices: formData.get("estimatedServices") || 0,
    servicesPeriod: formData.get("servicesPeriod") || "monthly",
  });

  if (!parsed.success) throw new Error(firstZodError(parsed.error));

  await prisma.flat.update({
    where: { id: flatId },
    data: {
      flatNumber: parsed.data.flatNumber,
      floor: parsed.data.floor,
      rooms: parsed.data.rooms,
      sizeSqm: parsed.data.sizeSqm,
      electricBoxNo: parsed.data.electricBoxNo || null,
      licenseNo: parsed.data.licenseNo || null,
      estimatedRent: parsed.data.estimatedRent,
      estimatedServices: parsed.data.estimatedServices,
      servicesPeriod: parsed.data.servicesPeriod,
    },
  });

  revalidatePath(`/flats/${flatId}`);
  revalidatePath(`/buildings/${flat.buildingId}`);
  revalidatePath("/dashboard");
}
