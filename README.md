# إجاراتي (EJARATI)

تطبيق ويب لإدارة العمارات والشقق ودفعات الإيجار في السعودية.

## الدخول

**إيميل → رمز OTP → دخول** عبر Supabase Auth (بدون كلمة مرور).

## إعداد Supabase Auth

1. Supabase → **Authentication → Providers → Email** → فعّل Email
2. عطّل "Confirm email" إذا تسبب بإعاقة للاختبار، أو اتركه حسب حاجتك
3. **Authentication → Email Templates → Magic Link**  
   تأكد أن القالب فيه الرمز: `{{ .Token }}`
4. **Project Settings → API** انسخ:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Authentication → URL Configuration**  
   - Site URL: `http://localhost:3002` (محلياً) أو رابط Vercel  
   - Redirect URLs: أضف نفس الروابط

## التشغيل محلياً

```bash
npm install
npx prisma migrate deploy
npm run dev
```

افتح [http://localhost:3002](http://localhost:3002)

## متغيرات البيئة

انظر `.env.example`

## النشر على Vercel

1. Import `alisami4sa/ejarati`
2. أضف كل متغيرات `.env`
3. Deploy
