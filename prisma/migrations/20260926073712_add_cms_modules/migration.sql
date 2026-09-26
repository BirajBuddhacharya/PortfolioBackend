-- CreateEnum
CREATE TYPE "ResumeSectionEnum" AS ENUM ('EXPERIENCE', 'EDUCATION', 'CERTIFICATION', 'SKILL');

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "coverImage" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_links" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contact_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_snapshot" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "chartBars" JSONB NOT NULL,
    "topPages" JSONB NOT NULL,
    "activity" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "headline" TEXT NOT NULL,
    "coverImage" TEXT,
    "paragraphs" JSONB NOT NULL,
    "facts" JSONB NOT NULL,
    "stats" JSONB NOT NULL,
    "ticker" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_items" (
    "id" TEXT NOT NULL,
    "section" "ResumeSectionEnum" NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "period" TEXT,
    "location" TEXT,
    "body" TEXT,
    "points" TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "resume_items_pkey" PRIMARY KEY ("id")
);
