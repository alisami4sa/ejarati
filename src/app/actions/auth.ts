"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAndSendOtp, verifyOtpCode } from "@/lib/otp";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session-token";

export type OtpActionState = { error?: string; ok?: boolean; email?: string };

export async function sendOtpAction(
  _: OtpActionState | undefined,
  formData: FormData,
): Promise<OtpActionState> {
  const email = String(formData.get("email") || "");
  const result = await createAndSendOtp(email);
  if ("error" in result && result.error) {
    return { error: result.error };
  }
  return { ok: true, email: result.email };
}

export async function verifyOtpAction(
  _: OtpActionState | undefined,
  formData: FormData,
): Promise<OtpActionState> {
  const email = String(formData.get("email") || "");
  const code = String(formData.get("otp") || "");
  const result = await verifyOtpCode(email, code);

  if ("error" in result && result.error) {
    return { error: result.error, email };
  }

  if (!result.user) {
    return { error: "تعذر إنشاء الجلسة", email };
  }

  const token = await createSessionToken({
    sub: result.user.id,
    email: result.user.email,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
