import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="app-shell">
      <AppHeader email={user.email} />
      <main className="page">{children}</main>
    </div>
  );
}
