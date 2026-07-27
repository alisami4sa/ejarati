export async function register() {
  // Intentionally empty: eager prisma.$connect() held pool slots and worsened
  // Supabase PgBouncer timeouts under Turbopack HMR.
}
