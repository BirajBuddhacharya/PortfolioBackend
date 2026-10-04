/*
  Warnings:

  - The `status` column on the `blog_posts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "blog_posts" DROP COLUMN "status",
ADD COLUMN     "status" "BlogStatus" NOT NULL DEFAULT 'DRAFT';
