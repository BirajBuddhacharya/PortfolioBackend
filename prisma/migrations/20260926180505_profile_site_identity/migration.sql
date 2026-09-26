-- AlterTable
ALTER TABLE "profile" ADD COLUMN     "avatarImage" TEXT,
ADD COLUMN     "ctaLabel" TEXT NOT NULL DEFAULT 'Hire me',
ADD COLUMN     "footerNote" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '';
