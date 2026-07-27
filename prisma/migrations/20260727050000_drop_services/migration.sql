-- Services are paid by the tenant; owners do not track them.
ALTER TABLE "Flat" DROP COLUMN "estimatedServices",
DROP COLUMN "servicesPeriod";

ALTER TABLE "Contract" DROP COLUMN "servicesIncluded",
DROP COLUMN "servicesAmount",
DROP COLUMN "servicesPeriod";
