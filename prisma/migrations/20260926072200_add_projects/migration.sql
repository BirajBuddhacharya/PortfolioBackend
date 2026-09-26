/*
  Warnings:

  - Added the required column `subject` to the `contact` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "contact" ADD COLUMN     "subject" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'live',
    "stack" TEXT[],
    "gallery" TEXT[],
    "metrics" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "live" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "coverHeight" INTEGER NOT NULL DEFAULT 260,
    "coverAccent" TEXT NOT NULL DEFAULT '#FF6B6B',
    "coverColor" TEXT NOT NULL DEFAULT '#141418',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
