import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { BuildingForm } from "@/components/building-form";
import { formatDate } from "@/lib/format";
import type { CalendarType } from "@/lib/hijri";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function EditBuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const building = await prisma.building.findFirst({
    where: { id, ownerId: user.id },
  });
  if (!building) notFound();

  return (
    <>
      <div className="page-head">
        <div className="page-head-main">
          <BackButton href={`/buildings/${building.id}`} label="رجوع للعمارة" />
          <h1 className="page-title">تعديل العمارة</h1>
          <p className="page-sub">{building.name}</p>
        </div>
      </div>
      <BuildingForm
        mode="edit"
        buildingId={building.id}
        cancelHref={`/buildings/${building.id}`}
        defaults={{
          name: building.name,
          ownerRefNumber: building.ownerRefNumber,
          deedDate: building.deedDate ? formatDate(building.deedDate) : null,
          deedCalendar:
            building.deedCalendar === "hijri" ||
            building.deedCalendar === "gregorian"
              ? (building.deedCalendar as CalendarType)
              : null,
        }}
      />
    </>
  );
}
