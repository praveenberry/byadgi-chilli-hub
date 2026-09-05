/*
  Warnings:

  - A unique constraint covering the columns `[awbNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "DispatchMethod" AS ENUM ('DELHIVERY', 'TRANSPORT');

-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('PENDING', 'PACKED', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION');

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_variantId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "awbNumber" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerMobile" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "deliveryDate" TIMESTAMP(3),
ADD COLUMN     "dispatchDate" TIMESTAMP(3),
ADD COLUMN     "dispatchMethod" "DispatchMethod",
ADD COLUMN     "dispatchNotes" TEXT,
ADD COLUMN     "lrNumber" TEXT,
ADD COLUMN     "packageCount" INTEGER,
ADD COLUMN     "shippingAddress1" TEXT,
ADD COLUMN     "shippingAddress2" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingPincode" TEXT,
ADD COLUMN     "shippingState" TEXT,
ADD COLUMN     "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalWeight" DECIMAL(10,2),
ADD COLUMN     "trackingUrl" TEXT,
ADD COLUMN     "transportName" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "OrderItem" ALTER COLUMN "variantId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_awbNumber_key" ON "Order"("awbNumber");

-- CreateIndex
CREATE INDEX "Order_shippingStatus_dispatchMethod_idx" ON "Order"("shippingStatus", "dispatchMethod");

-- CreateIndex
CREATE INDEX "Order_customerMobile_idx" ON "Order"("customerMobile");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
