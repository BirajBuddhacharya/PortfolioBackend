-- QA report cleanup for production data (B6 + test-data removal).
-- Run once against the production database:
--   psql "$DATABASE_URL" -f prisma/qa-report-cleanup.sql
--
-- Safe to re-run: every statement is a no-op once the bad values are gone.

BEGIN;

-- B6 — spelling fixes in profile copy (JSON string arrays).
UPDATE profile
SET paragraphs = replace(paragraphs::text, 'Collage', 'College')::jsonb
WHERE paragraphs::text LIKE '%Collage%';

UPDATE profile
SET facts = replace(facts::text, 'Collage', 'College')::jsonb
WHERE facts::text LIKE '%Collage%';

-- B6 — consistent employer spelling across the homepage and résumé (both read
-- from resume_items.organization/body).
UPDATE resume_items
SET organization = replace(organization, 'MindRisers', 'Mindrisers')
WHERE organization LIKE '%MindRisers%';

UPDATE resume_items
SET body = replace(body, 'MindRisers', 'Mindrisers')
WHERE body LIKE '%MindRisers%';

-- QA run artefacts: remove the two contact records created during the audit.
DELETE FROM contact
WHERE email IN ('qa-test@example.com', 'qa-bot-two@example.com');

-- A9 — remove the string-concatenation artefact ("."+p) from the draft excerpt.
UPDATE blog_posts
SET excerpt = regexp_replace(excerpt, '"[+]p$', '')
WHERE excerpt ~ '"[+]p$';

COMMIT;
