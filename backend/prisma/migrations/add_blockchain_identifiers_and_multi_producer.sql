-- CreateTable: BlockchainIdentifier
-- Stores mapping between user IDs and blockchain identifiers
CREATE TABLE "blockchain_identifiers" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "blockchainId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "blockchain_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: OrderProducer
-- Tracks all producers involved in multi-vendor orders
CREATE TABLE "order_producers" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "productIds" TEXT[],
    "subtotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_producers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_identifiers_blockchainId_key" ON "blockchain_identifiers"("blockchainId");

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_identifiers_userId_role_key" ON "blockchain_identifiers"("userId", "role");

-- CreateIndex
CREATE INDEX "blockchain_identifiers_blockchainId_idx" ON "blockchain_identifiers"("blockchainId");

-- CreateIndex
CREATE INDEX "blockchain_identifiers_userId_idx" ON "blockchain_identifiers"("userId");

-- CreateIndex
CREATE INDEX "blockchain_identifiers_role_idx" ON "blockchain_identifiers"("role");

-- CreateIndex
CREATE UNIQUE INDEX "order_producers_orderId_producerId_key" ON "order_producers"("orderId", "producerId");

-- CreateIndex
CREATE INDEX "order_producers_orderId_idx" ON "order_producers"("orderId");

-- CreateIndex
CREATE INDEX "order_producers_producerId_idx" ON "order_producers"("producerId");

-- AddForeignKey
ALTER TABLE "blockchain_identifiers" ADD CONSTRAINT "blockchain_identifiers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_producers" ADD CONSTRAINT "order_producers_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_producers" ADD CONSTRAINT "order_producers_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "producers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
