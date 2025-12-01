-- Add ProducerBankAccount table
CREATE TABLE IF NOT EXISTS "producer_bank_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producerId" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "branchName" TEXT,
    "swiftCode" TEXT,
    "accountType" TEXT NOT NULL DEFAULT 'SAVINGS',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "producer_bank_accounts_producerId_fkey" 
        FOREIGN KEY ("producerId") 
        REFERENCES "producers"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX "producer_bank_accounts_producerId_idx" ON "producer_bank_accounts"("producerId");
CREATE INDEX "producer_bank_accounts_isPrimary_idx" ON "producer_bank_accounts"("isPrimary");

-- Comments
COMMENT ON TABLE "producer_bank_accounts" IS 'Bank account information for producers to receive payouts';
COMMENT ON COLUMN "producer_bank_accounts"."isPrimary" IS 'Primary account for payouts';
COMMENT ON COLUMN "producer_bank_accounts"."isVerified" IS 'Whether account has been verified by admin';
