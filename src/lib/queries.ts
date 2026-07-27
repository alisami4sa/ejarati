import { cache } from "react";
import {
  endOfYearLocal,
  startOfDayLocal,
  startOfYearLocal,
} from "@/lib/dates";
import { isOpenContract } from "@/lib/format";
import { sumPaidThisYear, sumUnpaidThroughYearEnd } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

/** Lightweight dashboard: building cards + year totals via aggregates. */
export const getDashboardData = cache(async (ownerId: string) => {
  const today = startOfDayLocal(new Date());
  const yearFrom = startOfYearLocal();
  const yearTo = endOfYearLocal();

  const openContractFilter = {
    status: "active" as const,
    endDate: { gte: today },
    flat: { building: { ownerId } },
  };

  const [buildings, paidAgg, unpaidAgg] = await Promise.all([
    prisma.building.findMany({
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
            contracts: {
              where: { status: "active", endDate: { gte: today } },
              orderBy: { startDate: "desc" },
              take: 1,
              select: {
                startDate: true,
                endDate: true,
                status: true,
                rentAmount: true,
                _count: {
                  select: {
                    installments: {
                      where: {
                        status: { not: "paid" },
                        dueDate: { lt: today },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.installment.aggregate({
      where: {
        status: "paid",
        OR: [
          { paidAt: { gte: yearFrom, lte: yearTo } },
          {
            paidAt: null,
            dueDate: { gte: yearFrom, lte: yearTo },
          },
        ],
        contract: openContractFilter,
      },
      _sum: { amount: true },
    }),
    prisma.installment.aggregate({
      where: {
        status: { not: "paid" },
        dueDate: { gte: yearFrom, lte: yearTo },
        contract: openContractFilter,
      },
      _sum: { amount: true },
    }),
  ]);

  let flatCount = 0;
  const buildingSummaries = buildings.map((b) => {
    flatCount += b.flats.length;

    let leasesYearlyTotal = 0;
    let occupied = 0;
    let overdue = 0;

    for (const flat of b.flats) {
      const contract = flat.contracts[0];
      if (
        !contract ||
        !isOpenContract(contract.startDate, contract.endDate, contract.status)
      ) {
        continue;
      }
      occupied += 1;
      leasesYearlyTotal += contract.rentAmount;
      overdue += contract._count.installments;
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
    paidYtd: paidAgg._sum.amount ?? 0,
    unpaidToYearEnd: unpaidAgg._sum.amount ?? 0,
  };
});

export const getBuildingDetail = cache(
  async (buildingId: string, ownerId: string) => {
    const yearFrom = startOfYearLocal();

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
                  where: {
                    OR: [
                      { status: { not: "paid" } },
                      {
                        status: "paid",
                        OR: [
                          { paidAt: { gte: yearFrom } },
                          { paidAt: null, dueDate: { gte: yearFrom } },
                        ],
                      },
                    ],
                  },
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
  },
);

export const getFlatDetail = cache(async (flatId: string, ownerId: string) => {
  return prisma.flat.findFirst({
    where: { id: flatId, building: { ownerId } },
    include: {
      building: {
        select: {
          id: true,
          name: true,
          flats: { select: { flatNumber: true } },
        },
      },
      contracts: {
        take: 2,
        orderBy: { endDate: "desc" },
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
