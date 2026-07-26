# إجاراتي (EJARATI)

تطبيق ويب لإدارة العمارات والشقق ودفعات الإيجار في السعودية.

## التشغيل محلياً

```bash
npm install
npx prisma migrate dev
npm run dev
```

افتح [http://localhost:3002](http://localhost:3002)

أنشئ ملف `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="ضع-مفتاحا-طويلا-عشوائيا"
AUTH_URL="http://localhost:3002"
```

## النشر على Vercel

1. ارفع المشروع على GitHub (هذا الريبو).
2. ادخل [vercel.com](https://vercel.com) → **Add New Project** → اختر الريبو.
3. أضف Environment Variables:

| المتغير | القيمة |
|--------|--------|
| `DATABASE_URL` | رابط قاعدة بيانات Postgres (Neon/Supabase) |
| `AUTH_SECRET` | مفتاح عشوائي طويل (`openssl rand -base64 32`) |
| `AUTH_URL` | رابط موقعك على Vercel مثل `https://ejarati.vercel.app` |

> **مهم:** SQLite المحلي (`file:./dev.db`) لا يعمل على Vercel. تحتاج Postgres مجاني من [Neon](https://neon.tech) ثم غيّر في `prisma/schema.prisma` الـ provider إلى `postgresql` وشغّل `npx prisma migrate deploy`.

4. Deploy.
