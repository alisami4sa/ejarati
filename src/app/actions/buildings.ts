"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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
});

export async function createBuildingAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const parsed = buildingSchema.safeParse({
    name: formData.get("name"),
    ownerRefNumber: String(formData.get("ownerRefNumber") ?? ""),
  });
  if (!parsed.success) return { error: firstZodError(parsed.error) };

  const building = await prisma.building.create({
    data: {
      ownerId: user.id,
      name: parsed.data.name,
      ownerRefNumber: parsed.data.ownerRefNumber || null,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/buildings/${building.id}`);
}

export async function deleteBuildingAction(buildingId: string) {
  const user = await requireUser();
  await prisma.building.deleteMany({
    where: { id: buildingId, ownerId: user.id },
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
