import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { FlatForm } from "@/components/flat-form";
import { availableFlatNumbers } from "@/lib/flats";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function EditFlatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const flat = await prisma.flat.findFirst({
    where: { id, building: { ownerId: user.id } },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          flats: { select: { flatNumber: true } },
        },
      },
    },
  });
  if (!flat) notFound();

  const numbers = availableFlatNumbers(
    flat.building.flats.map((f) => f.flatNumber),
    flat.flatNumber,
  );

  return (
    <>
      <div className="page-head">
        <div className="page-head-main">
          <BackButton
            href={`/flats/${flat.id}`}
            label={`رجوع إلى شقة ${flat.flatNumber}`}
          />
          <h1 className="page-title">تعديل الشقة</h1>
          <p className="page-sub">
            {flat.building.name} / شقة {flat.flatNumber}
          </p>
        </div>
      </div>
      <FlatForm
        mode="edit"
        buildingId={flat.buildingId}
        flatId={flat.id}
        cancelHref={`/flats/${flat.id}`}
        availableNumbers={numbers}
        defaults={{
          flatNumber: flat.flatNumber,
          floor: flat.floor,
          rooms: flat.rooms,
          sizeSqm: flat.sizeSqm,
          electricBoxNo: flat.electricBoxNo,
          licenseNo: flat.licenseNo,
        }}
      />
    </>
  );
}
