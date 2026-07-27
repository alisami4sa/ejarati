import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { FlatForm } from "@/components/flat-form";
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
  });
  if (!building) notFound();

  return (
    <>
      <div className="page-head">
        <div className="page-head-main">
          <BackButton href={`/buildings/${building.id}`} label={`رجوع إلى ${building.name}`} />
          <h1 className="page-title">إضافة شقة</h1>
          <p className="page-sub">
            إذا كانت فارغة، ضع الإيجار التقديري ومبلغ الخدمات لتعرف قيمة الشغور
          </p>
        </div>
      </div>
      <FlatForm
        buildingId={building.id}
        cancelHref={`/buildings/${building.id}`}
      />
    </>
  );
}
