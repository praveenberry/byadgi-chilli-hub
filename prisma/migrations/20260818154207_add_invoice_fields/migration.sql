/*
  Warnings:

  - A unique constraint covering the columns `[invoiceNumber]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "invoiceDate" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_invoiceNumber_key" ON "Order"("invoiceNumber");
