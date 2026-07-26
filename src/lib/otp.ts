import { createHash, randomInt } from "crypto";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function hashOtp(email: string, code: string) {
  return createHash("sha256")
    .update(`${email}:${code}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex");
}

export function generateOtpCode() {
  return String(randomInt(100000, 999999));
}

export async function createAndSendOtp(emailRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "البريد الإلكتروني غير صالح" as const };
  }

  if (!process.env.RESEND_API_KEY) {
    return {
      error: "خدمة الإيميل غير مفعّلة. أضف RESEND_API_KEY في ملف .env" as const,
    };
  }

  const code = generateOtpCode();
  const codeHash = hashOtp(email, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.emailOtp.deleteMany({ where: { email } });
  await prisma.emailOtp.create({
    data: { email, codeHash, expiresAt },
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from =
    process.env.RESEND_FROM_EMAIL || "إجاراتي <noreply@mail.7xgb.online>";

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: "رمز الدخول — إجاراتي",
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.7;">
        <h2>رمز الدخول إلى إجاراتي</h2>
        <p>رمز التحقق الخاص بك:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; direction: ltr;">${code}</p>
        <p>صالح لمدة 10 دقائق.</p>
      </div>
    `,
  });

  if (error) {
    await prisma.emailOtp.deleteMany({ where: { email } });
    const msg = error.message || "";
    if (msg.toLowerCase().includes("verify a domain") || msg.toLowerCase().includes("testing emails")) {
      return {
        error:
          "تحقق من RESEND_FROM_EMAIL أنه على الدومين الموثّق مثل noreply@mail.7xgb.online" as const,
      };
    }
    return { error: msg || ("تعذر إرسال الإيميل" as const) };
  }

  return { ok: true as const, email };
}

export async function verifyOtpCode(emailRaw: string, codeRaw: string) {
  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.trim();

  if (!/^\d{6}$/.test(code)) {
    return { error: "الرمز يجب أن يكون 6 أرقام" as const };
  }

  const record = await prisma.emailOtp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { error: "اطلب رمزاً جديداً أولاً" as const };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailOtp.deleteMany({ where: { email } });
    return { error: "انتهت صلاحية الرمز. اطلب رمزاً جديداً" as const };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOtp.deleteMany({ where: { email } });
    return { error: "محاولات كثيرة. اطلب رمزاً جديداً" as const };
  }

  const codeHash = hashOtp(email, code);
  if (codeHash !== record.codeHash) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: "الرمز غير صحيح" as const };
  }

  await prisma.emailOtp.deleteMany({ where: { email } });

  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  return { ok: true as const, user };
}
