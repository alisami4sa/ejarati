import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Avoid breaking passwords with special characters when adding query params. */
function withQueryParams(url: string, params: Record<string, string>) {
  const extras = Object.entries(params)
    .filter(([key]) => !url.includes(`${key}=`))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    );
  if (extras.length === 0) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${extras.join("&")}`;
}

function createPrisma() {
  // App queries: transaction pooler (DATABASE_URL + pgbouncer).
  // DIRECT_URL stays for migrations only — session mode held slots and
  // caused P2024 pool timeouts against remote Supabase (Tokyo).
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is not set");
  }

  // Transaction pooler can multiplex; allow a few parallel queries without
  // the huge default pool that exhausted session mode (P2024).
  const url = withQueryParams(raw, {
    connection_limit: "5",
    pool_timeout: "60",
    connect_timeout: "20",
    pgbouncer: "true",
  });

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: { db: { url } },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
