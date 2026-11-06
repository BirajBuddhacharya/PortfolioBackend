-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- A9: repair the excerpt string-concatenation artefact ("."+p) committed into
-- the draft post. Safe to run repeatedly.
UPDATE "blog_posts"
SET "excerpt" = regexp_replace("excerpt", '"[+]p$', '')
WHERE "excerpt" ~ '"[+]p$';
