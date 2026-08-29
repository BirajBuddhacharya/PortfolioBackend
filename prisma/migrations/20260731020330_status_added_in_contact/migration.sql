-- CreateEnum
CREATE TYPE "ContactStatusEnum" AS ENUM ('UNREAD', 'READ');

-- AlterTable
ALTER TABLE "contact" ADD COLUMN     "status" "ContactStatusEnum" NOT NULL DEFAULT 'UNREAD';
