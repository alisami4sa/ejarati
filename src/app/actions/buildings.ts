"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { parseDateInput } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import {
  buildingNameSchema,
  deedNumberSchema,
  firstZodError,
} from "@/lib/validation";

export type ActionState = { error?: string } | undefined;

const buildingSchema = z.object({
  name: buildingNameSchema,
  ownerRefNumber: deedNumberSchema,
  deedDate: z.string().optional(),
  deedCalendar: z.enum(["hijri", "gregorian"]).optional(),
});

function parseDeedFields(formData: FormData) {
  const rawDate = String(formData.get("deedDate") ?? "").trim();
  const rawCalendar = String(formData.get("deedCalendar") ?? "").trim();

  const parsed = buildingSchema.safeParse({
    name: formData.get("name"),
    ownerRefNumber: String(formData.get("ownerRefNumber") ?? ""),
    deedDate: rawDate,
    deedCalendar:
      rawCalendar === "hijri" || rawCalendar === "gregorian"
        ? rawCalendar
        : undefined,
  });

  if (!parsed.success) {
    return { error: firstZodError(parsed.error) } as const;
  }

  if (rawDate) {
    if (!parsed.data.deedCalendar) {
      return { error: "اختر نوع تاريخ الصك: هجري أو ميلادي" } as const;
    }
    try {
      const deedDate = parseDateInput(rawDate);
      return {
        data: {
          name: parsed.data.name,
          ownerRefNumber: parsed.data.ownerRefNumber || null,
          deedDate,
          deedCalendar: parsed.data.deedCalendar,
        },
      } as const;
    } catch {
      return { error: "تاريخ الصك غير صالح" } as const;
    }
  }

  return {
    data: {
      name: parsed.data.name,
      ownerRefNumber: parsed.data.ownerRefNumber || null,
      deedDate: null,
      deedCalendar: null,
    },
  } as const;
}

export async function createBuildingAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = parseDeedFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  const building = await prisma.building.create({
    data: {
      ownerId: user.id,
      ...parsed.data,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/buildings/${building.id}`);
}

export async function updateBuildingAction(
  buildingId: string,
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const existing = await prisma.building.findFirst({
    where: { id: buildingId, ownerId: user.id },
  });
  if (!existing) return { error: "العمارة غير موجودة" };

  const parsed = parseDeedFields(formData);
  if ("error" in parsed) return { error: parsed.error };

  await prisma.building.update({
    where: { id: buildingId },
    data: parsed.data,
  });

  revalidatePath("/dashboard");
  revalidatePath(`/buildings/${buildingId}`);
  redirect(`/buildings/${buildingId}`);
}

export async function deleteBuildingAction(buildingId: string) {
  const user = await requireUser();
  await prisma.building.deleteMany({
    where: { id: buildingId, ownerId: user.id },
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
