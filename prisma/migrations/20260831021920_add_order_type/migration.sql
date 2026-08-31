-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "orderType" TEXT NOT NULL DEFAULT 'DINE_IN';
