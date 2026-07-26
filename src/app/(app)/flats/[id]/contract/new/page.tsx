import Link from "next/link";
import { notFound } from "next/navigation";
import { ContractForm } from "@/components/contract-form";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function NewContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const flat = await prisma.flat.findFirst({
    where: { id, building: { ownerId: user.id } },
    include: { building: true },
  });
  if (!flat) notFound();

  return (
    <>
      <div className="page-head">
        <div>
          <p className="page-sub">
            <Link href={`/flats/${flat.id}`}>
              {flat.building.name} / شقة {flat.flatNumber}
            </Link>
          </p>
          <h1 className="page-title">عقد جديد</h1>
          <p className="page-sub">التواريخ من التقويم فقط — والجوال بصيغة 05xxxxxxxx</p>
        </div>
      </div>
      <ContractForm
        flatId={flat.id}
        flatHref={`/flats/${flat.id}`}
        defaultRent={flat.estimatedRent || undefined}
        defaultServices={flat.estimatedServices}
        defaultServicesPeriod={flat.servicesPeriod}
      />
    </>
  );
}
