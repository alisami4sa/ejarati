import { Resend } from "resend";

export function getMailFrom() {
  return process.env.RESEND_FROM_EMAIL || "إجاراتي <noreply@mail.7xgb.online>";
}

export function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}
