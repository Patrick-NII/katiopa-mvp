/*
  Warnings:

  - The values [PRO,PRO_PLUS] on the enum `SubscriptionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionType_new" AS ENUM ('FREE', 'DECOUVERTE', 'EXPLORATEUR', 'MAITRE', 'ENTERPRISE');
ALTER TABLE "Account" ALTER COLUMN "subscriptionType" DROP DEFAULT;
ALTER TABLE "Account" ALTER COLUMN "subscriptionType" TYPE "SubscriptionType_new" USING ("subscriptionType"::text::"SubscriptionType_new");
ALTER TYPE "SubscriptionType" RENAME TO "SubscriptionType_old";
ALTER TYPE "SubscriptionType_new" RENAME TO "SubscriptionType";
DROP TYPE "SubscriptionType_old";
ALTER TABLE "Account" ALTER COLUMN "subscriptionType" SET DEFAULT 'FREE';
COMMIT;
