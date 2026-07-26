"use client";

import { useActionState, useState } from "react";
import {
  sendOtpAction,
  verifyOtpAction,
  type OtpActionState,
} from "@/app/actions/auth";

type Step = "email" | "otp";

export function OtpAuthForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const [sendState, sendAction, sendPending] = useActionState(
    async (state: OtpActionState | undefined, formData: FormData) => {
      const result = await sendOtpAction(state, formData);
      if (result.ok && result.email) {
        setEmail(result.email);
        setStep("otp");
      }
      return result;
    },
    undefined as OtpActionState | undefined,
  );

  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyOtpAction,
    undefined as OtpActionState | undefined,
  );

  const error = step === "email" ? sendState?.error : verifyState?.error;
  const pending = sendPending || verifyPending;

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
          <form action={sendAction} className="auth-stack">
            <label className="field">
              <span className="field-label">البريد الإلكتروني</span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                dir="ltr"
                defaultValue={email}
                placeholder="name@example.com"
              />
            </label>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={pending}>
              {pending ? "جارٍ الإرسال..." : "إرسال رمز الدخول"}
            </button>
          </form>
        ) : (
          <>
            <form action={verifyAction} className="auth-stack">
              <input type="hidden" name="email" value={email} />
              <label className="field">
                <span className="field-label">رمز التحقق (OTP)</span>
                <input
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  dir="ltr"
                  autoComplete="one-time-code"
                  placeholder="123456"
                />
                <span className="field-hint">صالح لمدة 10 دقائق</span>
              </label>
              {error && <p className="auth-error">{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={pending}>
                {pending ? "جارٍ التحقق..." : "تأكيد الدخول"}
              </button>
            </form>

            <div className="auth-stack" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={pending}
                onClick={() => setStep("email")}
              >
                تغيير البريد
              </button>
              <form action={sendAction}>
                <input type="hidden" name="email" value={email} />
                <button
                  className="btn btn-secondary"
                  type="submit"
                  disabled={pending}
                  style={{ width: "100%" }}
                >
                  إعادة إرسال الرمز
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
