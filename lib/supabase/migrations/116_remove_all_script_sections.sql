-- Remove all script sections added by previous migrations
-- Generated: 2025-12-01
-- This migration removes Example Scripts, Creative Opening Lines, and Value Statements sections

BEGIN;

-- Remove Example Scripts section from mirroring module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n## Example Scripts.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'mirroring';

-- Remove Sample Scripts for Different Energy Levels section from mirroring module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n## Sample Scripts for Different Energy Levels.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'mirroring';

-- Remove Creative Opening Lines section from pattern-interrupt module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Creative Opening Lines.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'pattern-interrupt';

-- Remove More Creative Icebreakers section from icebreaker module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## More Creative Icebreakers.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'icebreaker';

-- Remove Creative Opening Lines section from icebreaker module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Creative Opening Lines.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'icebreaker';

-- Remove Industry-Specific Creative Lines section from icebreaker module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Industry-Specific Creative Lines.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'icebreaker';

-- Remove Sample Scripts section from transition module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Sample Scripts.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'transition';

-- Remove Creative Closing Lines section from transition module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Creative Closing Lines.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'transition';

-- Remove Value Statements That Work section from keep-ammo module
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Value Statements That Work.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE slug = 'keep-ammo';

-- Remove Sample Scripts section from any other modules that might have them
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Sample Scripts.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE content LIKE '%## Sample Scripts%';

-- Remove Creative Opening Lines from any other modules
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Creative Opening Lines.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE content LIKE '%## Creative Opening Lines%';

-- Remove Creative Closing Lines from any other modules
UPDATE learning_modules
SET content = REGEXP_REPLACE(
    content,
    '\n---\s*\n\s*## Creative Closing Lines.*$',
    '',
    's'
),
    updated_at = NOW()
WHERE content LIKE '%## Creative Closing Lines%';

COMMIT;

