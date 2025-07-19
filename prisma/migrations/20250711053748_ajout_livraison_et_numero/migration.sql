/*
  Warnings:

  - A unique constraint covering the columns `[ordersNumber]` on the table `EcommerceOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `deliveryMethod` to the `EcommerceOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ordersNumber` to the `EcommerceOrder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('HOME_DELIVERY', 'STORE_PICKUP', 'LIFT', 'PICKUP', 'DROP');

-- AlterTable
ALTER TABLE "EcommerceOrder" ADD COLUMN     "deliveryMethod" "DeliveryMethod" NOT NULL,
ADD COLUMN     "ordersNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "EcommerceOrder_ordersNumber_key" ON "EcommerceOrder"("ordersNumber");
