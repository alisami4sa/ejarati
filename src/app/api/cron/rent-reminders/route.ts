import { NextResponse } from "next/server";
import { runAutomaticRentReminders } from "@/lib/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Daily cron: email owners about unpaid rent due in exactly 10 days. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");

  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 },
    );
  }

  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runAutomaticRentReminders(10);

  return NextResponse.json({
    ok: result.errors.length === 0,
    ...result,
  });
}
