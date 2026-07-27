export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { prisma } = await import("@/lib/prisma");
  await prisma.$connect().catch(() => {
    // Connection will retry on first query
  });
}
