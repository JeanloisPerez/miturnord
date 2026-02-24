/*
  Warnings:

  - You are about to drop the column `owner_id` on the `Institution` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "InstitutionRole" AS ENUM ('OWNER', 'STAFF', 'MANAGER');

-- DropForeignKey
ALTER TABLE "Institution" DROP CONSTRAINT "Institution_owner_id_fkey";

-- AlterTable
ALTER TABLE "Institution" DROP COLUMN "owner_id";

-- CreateTable
CREATE TABLE "InstitutionUser" (
    "id" TEXT NOT NULL,
    "institution_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "InstitutionRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionUser_institution_id_idx" ON "InstitutionUser"("institution_id");

-- CreateIndex
CREATE INDEX "InstitutionUser_user_id_idx" ON "InstitutionUser"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionUser_institution_id_user_id_key" ON "InstitutionUser"("institution_id", "user_id");

-- AddForeignKey
ALTER TABLE "InstitutionUser" ADD CONSTRAINT "InstitutionUser_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionUser" ADD CONSTRAINT "InstitutionUser_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
