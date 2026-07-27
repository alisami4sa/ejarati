import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { FlatForm } from "@/components/flat-form";
import { availableFlatNumbers } from "@/lib/flats";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function NewFlatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const building = await prisma.building.findFirst({
    where: { id, ownerId: user.id },
    include: { flats: { select: { flatNumber: true } } },
  });
  if (!building) notFound();

  const numbers = availableFlatNumbers(
    building.flats.map((f) => f.flatNumber),
  );

  return (
    <>
      <div className="page-head">
        <div className="page-head-main">
          <BackButton href={`/buildings/${building.id}`} label={`رجوع إلى ${building.name}`} />
          <h1 className="page-title">إضافة شقة</h1>
          <p className="page-sub">
            الإيجار يُدخل لاحقاً مع العقد والمستأجر — هنا مواصفات الشقة فقط
          </p>
        </div>
      </div>
      <FlatForm
        buildingId={building.id}
        cancelHref={`/buildings/${building.id}`}
        availableNumbers={numbers}
      />
    </>
  );
}
