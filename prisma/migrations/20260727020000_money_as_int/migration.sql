-- Store money as whole riyals (integer) to avoid float drift like 24000 → 23998.
ALTER TABLE "Flat"
  ALTER COLUMN "estimatedRent" SET DATA TYPE INTEGER USING ROUND("estimatedRent")::INTEGER,
  ALTER COLUMN "estimatedRent" SET DEFAULT 0,
  ALTER COLUMN "estimatedServices" SET DATA TYPE INTEGER USING ROUND("estimatedServices")::INTEGER,
  ALTER COLUMN "estimatedServices" SET DEFAULT 0;

ALTER TABLE "Contract"
  ALTER COLUMN "rentAmount" SET DATA TYPE INTEGER USING ROUND("rentAmount")::INTEGER,
  ALTER COLUMN "servicesAmount" SET DATA TYPE INTEGER USING ROUND("servicesAmount")::INTEGER,
  ALTER COLUMN "servicesAmount" SET DEFAULT 0;

ALTER TABLE "Installment"
  ALTER COLUMN "amount" SET DATA TYPE INTEGER USING ROUND("amount")::INTEGER;
