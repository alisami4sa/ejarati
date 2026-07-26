# إجاراتي (EJARATI)

تطبيق ويب لإدارة العمارات والشقق ودفعات الإيجار في السعودية.

## قاعدة البيانات: Supabase (Postgres)

1. أنشئ مشروعاً في [supabase.com](https://supabase.com)
2. ادخل **Project Settings → Database**
3. انسخ رابطين:
   - **Connection pooling** → Transaction → URI (منفذ `6543`) → ضعه في `DATABASE_URL` وأضف في آخره `?pgbouncer=true` إن لم يكن موجوداً
   - **Direct connection** → URI (منفذ `5432`) → ضعه في `DIRECT_URL`
4. انسخ `.env.example` إلى `.env` والصق الروابط
5. شغّل الجداول:

```bash
npm install
npx prisma migrate deploy
npm run dev
```

افتح [http://localhost:3002](http://localhost:3002)

## متغيرات البيئة

```env
DATABASE_URL="postgresql://...pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@db.xxxxx.supabase.co:5432/postgres"
AUTH_SECRET="مفتاح-عشوائي-طويل"
AUTH_URL="http://localhost:3002"
```

## النشر على Vercel

1. Import الريبو من GitHub
2. أضف نفس المتغيرات أعلاه (`AUTH_URL` = رابط موقعك على Vercel)
3. Deploy — أمر البناء يشغّل `prisma migrate deploy` تلقائياً
