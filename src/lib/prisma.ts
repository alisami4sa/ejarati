import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrisma() {
  // Local/dev: session pooler (DIRECT_URL) is faster on a long-lived server.
  // Production/Vercel: keep transaction pooler (DATABASE_URL).
  const url =
    process.env.NODE_ENV === "development"
      ? process.env.DIRECT_URL || process.env.DATABASE_URL
      : process.env.DATABASE_URL;

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: url ? { db: { url } } : undefined,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
