import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";

export function AppHeader({ email }: { email?: string | null }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/dashboard" className="brand">
          إجاراتي
        </Link>
        <div className="header-meta">
          {email && <span className="header-email">{email}</span>}
          <form action={logoutAction}>
            <button type="submit" className="btn btn-ghost">
              خروج
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
