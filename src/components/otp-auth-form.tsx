"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "otp";

export function OtpAuthForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error: sendError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      });
      if (sendError) {
        setError(sendError.message || "تعذر إرسال الرمز");
        return;
      }
      setStep("otp");
    } catch {
      setError("تعذر الاتصال بخدمة الدخول. تحقق من إعدادات Supabase.");
    } finally {
      setPending(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: otp.trim(),
        type: "email",
      });
      if (verifyError) {
        setError("الرمز غير صحيح أو منتهي. حاول مرة أخرى.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("تعذر التحقق من الرمز");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-brand">إجاراتي</h1>
        <p className="auth-sub">
          {step === "email"
            ? "أدخل بريدك وسنرسل لك رمز الدخول"
            : `أدخل الرمز المرسل إلى ${email}`}
        </p>

        {step === "email" ? (
          <form onSubmit={sendOtp} className="auth-stack">
            <label className="field">
              <span className="field-label">البريد الإلكتروني</span>
              <input
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? "جارٍ الإرسال..." : "إرسال رمز الدخول"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="auth-stack">
            <label className="field">
              <span className="field-label">رمز التحقق (OTP)</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6,8}"
                minLength={6}
                maxLength={8}
                required
                dir="ltr"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
              />
              <span className="field-hint">تحقق من بريدك — صالح لدقائق قليلة</span>
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? "جارٍ التحقق..." : "تأكيد الدخول"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={pending}
              onClick={() => {
                setStep("email");
                setOtp("");
                setError(null);
              }}
            >
              تغيير البريد
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={pending}
              onClick={sendOtp}
            >
              إعادة إرسال الرمز
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
