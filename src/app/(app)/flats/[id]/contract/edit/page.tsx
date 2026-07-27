import { notFound } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { ContractForm } from "@/components/contract-form";
import { toDateKey } from "@/lib/dates";
import { isOpenContract } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function EditContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id: flatId } = await params;

  const flat = await prisma.flat.findFirst({
    where: { id: flatId, building: { ownerId: user.id } },
    select: {
      id: true,
      flatNumber: true,
      contracts: {
        where: { status: "active" },
        orderBy: { startDate: "desc" },
        take: 1,
        include: { tenant: true },
      },
    },
  });
  if (!flat) notFound();

  const contract =
    flat.contracts.find((c) =>
      isOpenContract(c.startDate, c.endDate, c.status),
    ) ?? flat.contracts[0];

  if (!contract) notFound();

  return (
    <>
      <div className="page-head">
        <div className="page-head-main">
          <BackButton
            href={`/flats/${flat.id}`}
            label={`رجوع إلى شقة ${flat.flatNumber}`}
          />
          <h1 className="page-title">تعديل العقد</h1>
          <p className="page-sub">
            صحّح التواريخ أو بيانات المستأجر — الدفعات تُحدَّث تلقائياً
          </p>
        </div>
      </div>
      <ContractForm
        mode="edit"
        flatId={flat.id}
        contractId={contract.id}
        flatHref={`/flats/${flat.id}`}
        defaults={{
          tenantName: contract.tenant.name,
          tenantMobile: contract.tenant.mobile,
          tenantNationalId: contract.tenant.nationalId,
          contractNumber: contract.contractNumber,
          startDate: toDateKey(contract.startDate),
          endDate: toDateKey(contract.endDate),
          rentAmount: contract.rentAmount,
          installmentCount: contract.installmentCount,
        }}
      />
    </>
  );
}
