import { startOfDayLocal } from "@/lib/dates";
import { isActiveContract } from "@/lib/format";
import { annualizeServices } from "@/lib/installments";
import { sumPaidThisYear, sumUnpaidThroughYearEnd } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export async function getDashboardData(ownerId: string) {
  const buildings = await prisma.building.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
    include: {
      flats: {
        include: {
          contracts: {
            where: { status: "active" },
            include: {
              tenant: true,
              installments: true,
            },
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
  });

  const today = startOfDayLocal(new Date());

  let paidYtd = 0;
  let unpaidToYearEnd = 0;
  let flatCount = 0;

  for (const b of buildings) {
    flatCount += b.flats.length;
    for (const flat of b.flats) {
      const contract =
        flat.contracts.find((c) =>
          isActiveContract(c.startDate, c.endDate, c.status),
        ) ?? flat.contracts[0];
      if (!contract) continue;
      paidYtd += sumPaidThisYear(contract.installments);
      unpaidToYearEnd += sumUnpaidThroughYearEnd(contract.installments);
    }
  }

  const buildingSummaries = buildings.map((b) => {
    const servicesTotal = b.flats.reduce((sum, flat) => {
      const contract =
        flat.contracts.find((c) =>
          isActiveContract(c.startDate, c.endDate, c.status),
        ) ?? null;
      if (contract) {
        return sum + annualizeServices(contract.servicesAmount, contract.servicesPeriod);
      }
      return sum + annualizeServices(flat.estimatedServices, flat.servicesPeriod);
    }, 0);

    const occupied = b.flats.filter((f) =>
      f.contracts.some((c) => isActiveContract(c.startDate, c.endDate, c.status)),
    ).length;

    let overdue = 0;
    for (const flat of b.flats) {
      const c =
        flat.contracts.find((x) =>
          isActiveContract(x.startDate, x.endDate, x.status),
        ) ?? flat.contracts[0];
      if (!c) continue;
      overdue += c.installments.filter(
        (i) => i.status !== "paid" && startOfDayLocal(i.dueDate) < today,
      ).length;
    }

    return {
      id: b.id,
      name: b.name,
      ownerRefNumber: b.ownerRefNumber,
      flatCount: b.flats.length,
      occupied,
      empty: b.flats.length - occupied,
      servicesTotal,
      overdue,
    };
  });

  return {
    buildings: buildingSummaries,
    flatCount,
    buildingCount: buildings.length,
    paidYtd,
    unpaidToYearEnd,
  };
}

export async function getBuildingDetail(buildingId: string, ownerId: string) {
  const building = await prisma.building.findFirst({
    where: { id: buildingId, ownerId },
    include: {
      flats: {
        orderBy: { flatNumber: "asc" },
        include: {
          contracts: {
            include: {
              tenant: true,
              installments: { orderBy: { dueDate: "asc" } },
            },
            orderBy: { startDate: "desc" },
          },
        },
      },
    },
  });
  return building;
}

export async function getFlatDetail(flatId: string, ownerId: string) {
  return prisma.flat.findFirst({
    where: { id: flatId, building: { ownerId } },
    include: {
      building: true,
      contracts: {
        include: {
          tenant: true,
          installments: { orderBy: { dueDate: "asc" } },
        },
        orderBy: { startDate: "desc" },
      },
    },
  });
}
