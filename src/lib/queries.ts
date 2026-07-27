import { cache } from "react";
import { startOfDayLocal } from "@/lib/dates";
import { isActiveContract } from "@/lib/format";
import { sumPaidThisYear, sumUnpaidThroughYearEnd } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

export const getDashboardData = cache(async (ownerId: string) => {
  const buildings = await prisma.building.findMany({
    where: { ownerId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      ownerRefNumber: true,
      deedDate: true,
      deedCalendar: true,
      flats: {
        select: {
          id: true,
          estimatedRent: true,
          contracts: {
            where: { status: "active" },
            orderBy: { startDate: "desc" },
            take: 1,
            select: {
              startDate: true,
              endDate: true,
              status: true,
              rentAmount: true,
              installments: {
                select: {
                  amount: true,
                  status: true,
                  dueDate: true,
                  paidAt: true,
                },
              },
            },
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
      const contract = flat.contracts[0];
      if (!contract) continue;
      if (!isActiveContract(contract.startDate, contract.endDate, contract.status)) {
        continue;
      }
      paidYtd += sumPaidThisYear(contract.installments);
      unpaidToYearEnd += sumUnpaidThroughYearEnd(contract.installments);
    }
  }

  const buildingSummaries = buildings.map((b) => {
    // Yearly lease value: active contract rent, else estimated rent for empty flats
    const leasesYearlyTotal = b.flats.reduce((sum, flat) => {
      const contract = flat.contracts[0];
      if (
        contract &&
        isActiveContract(contract.startDate, contract.endDate, contract.status)
      ) {
        return sum + contract.rentAmount;
      }
      return sum + (flat.estimatedRent || 0);
    }, 0);

    const occupied = b.flats.filter((f) => {
      const c = f.contracts[0];
      return c && isActiveContract(c.startDate, c.endDate, c.status);
    }).length;

    let overdue = 0;
    for (const flat of b.flats) {
      const c = flat.contracts[0];
      if (!c || !isActiveContract(c.startDate, c.endDate, c.status)) continue;
      overdue += c.installments.filter(
        (i) => i.status !== "paid" && startOfDayLocal(i.dueDate) < today,
      ).length;
    }

    return {
      id: b.id,
      name: b.name,
      ownerRefNumber: b.ownerRefNumber,
      deedDate: b.deedDate,
      deedCalendar: b.deedCalendar,
      flatCount: b.flats.length,
      occupied,
      empty: b.flats.length - occupied,
      leasesYearlyTotal,
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
});

export const getBuildingDetail = cache(async (buildingId: string, ownerId: string) => {
  return prisma.building.findFirst({
    where: { id: buildingId, ownerId },
    include: {
      flats: {
        orderBy: { flatNumber: "asc" },
        include: {
          contracts: {
            where: { status: "active" },
            take: 1,
            orderBy: { startDate: "desc" },
            include: {
              tenant: true,
              installments: {
                orderBy: { dueDate: "asc" },
                select: {
                  id: true,
                  dueDate: true,
                  amount: true,
                  status: true,
                  paidAt: true,
                },
              },
            },
          },
        },
      },
    },
  });
});

export const getFlatDetail = cache(async (flatId: string, ownerId: string) => {
  return prisma.flat.findFirst({
    where: { id: flatId, building: { ownerId } },
    include: {
      building: { select: { id: true, name: true } },
      contracts: {
        where: { status: "active" },
        take: 1,
        orderBy: { startDate: "desc" },
        include: {
          tenant: true,
          installments: {
            orderBy: { dueDate: "asc" },
            select: {
              id: true,
              dueDate: true,
              amount: true,
              status: true,
              paidAt: true,
            },
          },
        },
      },
    },
  });
});
