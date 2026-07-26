"use client";

import Link from "next/link";
import { useActionState } from "react";

type AuthState = { error?: string } | undefined;

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined as AuthState);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-brand">إجاراتي</h1>
        <p className="auth-sub">
          {mode === "login"
            ? "سجّل الدخول لمتابعة دفعات عماراتك"
            : "أنشئ حساباً بالبريد لإدارة عماراتك"}
        </p>

        <form action={formAction} className="auth-stack">
          {mode === "register" && (
            <label className="field">
              <span className="field-label">الاسم</span>
              <input name="name" type="text" autoComplete="name" />
            </label>
          )}
          <label className="field">
            <span className="field-label">البريد الإلكتروني</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              dir="ltr"
            />
          </label>
          <label className="field">
            <span className="field-label">كلمة المرور</span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              dir="ltr"
            />
          </label>

          {state?.error && <p className="auth-error">{state.error}</p>}

          <button className="btn btn-primary" type="submit" disabled={pending}>
            {pending
              ? "جارٍ..."
              : mode === "login"
                ? "دخول"
                : "إنشاء حساب"}
          </button>
        </form>

        <p className="auth-foot">
          {mode === "login" ? (
            <>
              ليس لديك حساب؟ <Link href="/register">إنشاء حساب</Link>
            </>
          ) : (
            <>
              لديك حساب؟ <Link href="/login">تسجيل الدخول</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
