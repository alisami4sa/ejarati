-- Rent belongs on the contract only; remove unused flat estimated rent.
ALTER TABLE "Flat" DROP COLUMN "estimatedRent";
