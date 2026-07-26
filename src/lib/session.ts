import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const email = user.email.toLowerCase();

  const dbUser = await prisma.user.upsert({
    where: { email },
    create: {
      id: user.id,
      email,
      name: user.user_metadata?.name ?? null,
    },
    update: {
      // keep local row in sync with auth identity
    },
  });

  return dbUser;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
