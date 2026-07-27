"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { z } from "zod";
import type { ActionState } from "@/app/actions/buildings";
import { availableFlatNumbers, FLAT_NUMBER_MAX } from "@/lib/flats";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  firstZodError,
  flatNumberSchema,
  meterNumberSchema,
  optionalFloatSchema,
  optionalIntSchema,
} from "@/lib/validation";

export type DuplicateFlatState = { error?: string } | undefined;

const flatSchema = z.object({
  buildingId: z.string().min(1),
  flatNumber: flatNumberSchema,
  floor: optionalIntSchema("الدور", 0, 200),
  rooms: optionalIntSchema("عدد الغرف", 1, 20),
  sizeSqm: optionalFloatSchema("المساحة", 1, 10000),
  electricBoxNo: meterNumberSchema,
  licenseNo: meterNumberSchema,
});

async function assertBuilding(buildingId: string, ownerId: string) {
  const building = await prisma.building.findFirst({
    where: { id: buildingId, ownerId },
  });
  if (!building) throw new Error("العمارة غير موجودة");
  return building;
}

function parseFlatForm(formData: FormData, withBuildingId: boolean) {
  return {
    ...(withBuildingId ? { buildingId: formData.get("buildingId") } : {}),
    flatNumber: formData.get("flatNumber"),
    floor: formData.get("floor"),
    rooms: formData.get("rooms"),
    sizeSqm: formData.get("sizeSqm"),
    electricBoxNo: String(formData.get("electricBoxNo") ?? ""),
    licenseNo: String(formData.get("licenseNo") ?? ""),
  };
}

export async function createFlatAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = flatSchema.safeParse(parseFlatForm(formData, true));

  if (!parsed.success) return { error: firstZodError(parsed.error) };

  await assertBuilding(parsed.data.buildingId, user.id);

  try {
    const flat = await prisma.flat.create({
      data: {
        buildingId: parsed.data.buildingId,
        flatNumber: parsed.data.flatNumber,
        floor: parsed.data.floor,
        rooms: parsed.data.rooms,
        sizeSqm: parsed.data.sizeSqm,
        electricBoxNo: parsed.data.electricBoxNo || null,
        licenseNo: parsed.data.licenseNo || null,
      },
    });

    revalidatePath(`/buildings/${parsed.data.buildingId}`);
    revalidatePath("/dashboard");
    redirect(`/flats/${flat.id}`);
  } catch (error) {
    unstable_rethrow(error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "رقم الشقة مستخدم مسبقاً في هذه العمارة" };
    }
    return { error: "تعذر حفظ الشقة. حاول مرة أخرى" };
  }
}

export async function updateFlatAction(
  flatId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const flat = await prisma.flat.findFirst({
    where: { id: flatId, building: { ownerId: user.id } },
  });
  if (!flat) return { error: "الشقة غير موجودة" };

  const parsed = flatSchema.omit({ buildingId: true }).safeParse(
    parseFlatForm(formData, false),
  );

  if (!parsed.success) return { error: firstZodError(parsed.error) };

  try {
    await prisma.flat.update({
      where: { id: flatId },
      data: {
        flatNumber: parsed.data.flatNumber,
        floor: parsed.data.floor,
        rooms: parsed.data.rooms,
        sizeSqm: parsed.data.sizeSqm,
        electricBoxNo: parsed.data.electricBoxNo || null,
        licenseNo: parsed.data.licenseNo || null,
      },
    });

    revalidatePath(`/flats/${flatId}`);
    revalidatePath(`/buildings/${flat.buildingId}`);
    revalidatePath("/dashboard");
    redirect(`/flats/${flatId}`);
  } catch (error) {
    unstable_rethrow(error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "رقم الشقة مستخدم مسبقاً في هذه العمارة" };
    }
    return { error: "تعذر التعديل. حاول مرة أخرى" };
  }
}

export async function deleteFlatAction(flatId: string) {
  const user = await requireUser();
  const flat = await prisma.flat.findFirst({
    where: { id: flatId, building: { ownerId: user.id } },
  });
  if (!flat) throw new Error("الشقة غير موجودة");

  await prisma.flat.delete({ where: { id: flatId } });

  revalidatePath(`/buildings/${flat.buildingId}`);
  revalidatePath("/dashboard");
  redirect(`/buildings/${flat.buildingId}`);
}

/** Copy flat specs (no meters) into the next available numbers. */
export async function duplicateFlatAction(
  flatId: string,
  _: DuplicateFlatState,
  formData: FormData,
): Promise<DuplicateFlatState> {
  const user = await requireUser();
  const countRaw = Number(formData.get("count"));
  const count = Number.isInteger(countRaw) ? countRaw : NaN;
  if (!Number.isFinite(count) || count < 1 || count > FLAT_NUMBER_MAX) {
    return { error: `اختر عدداً من 1 إلى ${FLAT_NUMBER_MAX}` };
  }

  const source = await prisma.flat.findFirst({
    where: { id: flatId, building: { ownerId: user.id } },
    include: {
      building: {
        include: { flats: { select: { flatNumber: true } } },
      },
    },
  });
  if (!source) return { error: "الشقة غير موجودة" };

  const free = availableFlatNumbers(
    source.building.flats.map((f) => f.flatNumber),
  );
  if (free.length === 0) {
    return { error: "لا توجد أرقام شقق متاحة في هذه العمارة" };
  }
  if (count > free.length) {
    return {
      error: `المتاح حالياً ${free.length} رقم فقط. اختر عدداً أقل أو يساوي ${free.length}`,
    };
  }

  const numbers = free.slice(0, count);

  try {
    await prisma.flat.createMany({
      data: numbers.map((flatNumber) => ({
        buildingId: source.buildingId,
        flatNumber,
        floor: source.floor,
        rooms: source.rooms,
        sizeSqm: source.sizeSqm,
        electricBoxNo: null,
        licenseNo: null,
      })),
    });
  } catch (error) {
    unstable_rethrow(error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "تعذر التكرار بسبب تعارض في أرقام الشقق. حدّث الصفحة وحاول مجدداً" };
    }
    return { error: "تعذر تكرار الشقة. حاول مرة أخرى" };
  }

  revalidatePath(`/buildings/${source.buildingId}`);
  revalidatePath("/dashboard");
  redirect(`/buildings/${source.buildingId}`);
}
