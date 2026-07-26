import { z } from "zod";

/** Convert Arabic/Persian digits and strip spaces/dashes. */
export function normalizeDigits(value: string) {
  return value
    .trim()
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[\s\-]/g, "");
}

export const saudiMobileSchema = z
  .string()
  .transform(normalizeDigits)
  .refine((v) => /^05\d{8}$/.test(v), {
    message: "رقم الجوال يجب أن يكون 10 أرقام ويبدأ بـ 05 مثل 0512345678",
  });

/** Saudi national / Iqama ID: 10 digits starting with 1 or 2 */
export const saudiNationalIdSchema = z
  .string()
  .transform(normalizeDigits)
  .refine((v) => v === "" || /^[12]\d{9}$/.test(v), {
    message: "رقم الهوية يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2",
  });

/** Ejar-style contract numbers seen in your sheets: 11 digits */
export const contractNumberSchema = z
  .string()
  .transform(normalizeDigits)
  .refine((v) => /^\d{11}$/.test(v), {
    message: "رقم العقد يجب أن يكون 11 رقماً",
  });

/** Optional deed number — digits only when provided */
export const deedNumberSchema = z
  .string()
  .transform(normalizeDigits)
  .refine((v) => v === "" || /^\d{5,20}$/.test(v), {
    message: "رقم الصك يجب أن يكون أرقاماً فقط (5–20 رقم)",
  });

/** Optional meter numbers — digits only when provided */
export const meterNumberSchema = z
  .string()
  .transform(normalizeDigits)
  .refine((v) => v === "" || /^\d{4,20}$/.test(v), {
    message: "رقم العداد يجب أن يكون أرقاماً فقط (4–20 رقم)",
  });

export const personNameSchema = z
  .string()
  .trim()
  .min(2, "الاسم قصير جداً")
  .max(80, "الاسم طويل جداً")
  .refine((v) => /^[\u0600-\u06FFa-zA-Z\s]+$/.test(v), {
    message: "الاسم يقبل حروف عربية أو إنجليزية فقط",
  });

export const buildingNameSchema = z
  .string()
  .trim()
  .min(2, "اسم العمارة مطلوب")
  .max(80, "اسم العمارة طويل جداً");

export const flatNumberSchema = z
  .string()
  .trim()
  .transform(normalizeDigits)
  .refine((v) => /^\d{1,10}$/.test(v), {
    message: "رقم الشقة يجب أن يكون أرقاماً فقط",
  });

export function moneySchema(label: string, opts?: { min?: number }) {
  const min = opts?.min ?? 0;
  return z.coerce
    .number()
    .refine((v) => Number.isFinite(v), { message: `${label} غير صالح` })
    .min(min, { message: `${label} لا يمكن أن يكون أقل من ${min}` });
}

export function optionalIntSchema(label: string, min = 0, max = 200) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce
      .number()
      .int({ message: `${label} يجب أن يكون عدداً صحيحاً` })
      .min(min, { message: `${label} صغير جداً` })
      .max(max, { message: `${label} كبير جداً` })
      .nullable(),
  );
}

export function optionalFloatSchema(label: string, min = 0, max = 100000) {
  return z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : v),
    z.coerce
      .number()
      .refine((v) => v === null || Number.isFinite(v), {
        message: `${label} غير صالح`,
      })
      .min(min, { message: `${label} صغير جداً` })
      .max(max, { message: `${label} كبير جداً` })
      .nullable(),
  );
}

export function firstZodError(error: z.ZodError) {
  return error.issues[0]?.message ?? "تحقق من الحقول";
}

/** HTML pattern helpers for client-side constraints */
export const patterns = {
  saudiMobile: "05[0-9]{8}",
  saudiNationalId: "[12][0-9]{9}",
  contractNumber: "[0-9]{11}",
  deedNumber: "[0-9]{5,20}",
  meterNumber: "[0-9]{4,20}",
  flatNumber: "[0-9]{1,10}",
} as const;
