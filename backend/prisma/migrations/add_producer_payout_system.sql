-- CreateEnum: PayoutStatus
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterTable: order_producers - Add payout tracking fields
-- First add columns with defaults
ALTER TABLE "order_producers" 
ADD COLUMN IF NOT EXISTS "marketplaceCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "producerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "payoutReference" TEXT;

-- CreateIndex
CREATE INDEX "order_producers_payoutStatus_idx" ON "order_producers"("payoutStatus");

-- CreateTable: producer_payouts
CREATE TABLE "producer_payouts" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "netAmount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "payoutMethod" TEXT,
    "payoutReference" TEXT,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producer_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: payout_order_items
CREATE TABLE "payout_order_items" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "orderProducerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payout_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "producer_payouts_producerId_idx" ON "producer_payouts"("producerId");

-- CreateIndex
CREATE INDEX "producer_payouts_status_idx" ON "producer_payouts"("status");

-- CreateIndex
CREATE INDEX "producer_payouts_scheduledFor_idx" ON "producer_payouts"("scheduledFor");

-- CreateIndex
CREATE INDEX "producer_payouts_producerId_status_idx" ON "producer_payouts"("producerId", "status");

-- CreateIndex
CREATE INDEX "payout_order_items_payoutId_idx" ON "payout_order_items"("payoutId");

-- CreateIndex
CREATE INDEX "payout_order_items_orderProducerId_idx" ON "payout_order_items"("orderProducerId");

-- AddForeignKey
ALTER TABLE "producer_payouts" ADD CONSTRAINT "producer_payouts_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "producers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_order_items" ADD CONSTRAINT "payout_order_items_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "producer_payouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_order_items" ADD CONSTRAINT "payout_order_items_orderProducerId_fkey" FOREIGN KEY ("orderProducerId") REFERENCES "order_producers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update existing order_producers records to calculate producerAmount
-- Assuming 10% commission rate
UPDATE "order_producers" 
SET 
  "marketplaceCommission" = "subtotal" * 0.10,
  "producerAmount" = "subtotal" * 0.90
WHERE "producerAmount" = 0;
