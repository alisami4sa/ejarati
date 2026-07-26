# إجاراتي (EJARATI)

تطبيق ويب لإدارة العمارات والشقق ودفعات الإيجار في السعودية.

## الدخول

**إيميل → رمز OTP (6 أرقام) → دخول**  
الإرسال عبر [Resend](https://resend.com) — بدون SMTP داخل Supabase.

## إعداد Resend (دقيقتان)

1. سجّل في [resend.com](https://resend.com) مجاناً
2. **API Keys → Create API Key** وانسخ المفتاح `re_...`
3. ضعه في `.env`:

```env
RESEND_API_KEY="re_xxxxxxxx"
RESEND_FROM_EMAIL="إجاراتي <onboarding@resend.dev>"
AUTH_SECRET="any-long-random-string"
```

> مع `onboarding@resend.dev` يوصل الإيميل **فقط** لبريد حسابك في Resend (للاختبار).  
> لاحقاً اربط دومينك في Resend عشان ترسل لأي إيميل.

## قاعدة البيانات (Supabase Postgres)

```env
DATABASE_URL="postgresql://...pooler...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...pooler...:5432/postgres"
```

```bash
npm install
npx prisma migrate deploy
npm run dev
```

## PWA

التطبيق قابل للتثبيت على الجوال (Add to Home Screen) بعد النشر على HTTPS (Vercel).

- iPhone: Safari → مشاركة → إضافة إلى الشاشة الرئيسية  
- Android: Chrome → تثبيت التطبيق / Add to Home screen  

## النشر على Vercel

أضف كل متغيرات `.env` ثم Deploy.
