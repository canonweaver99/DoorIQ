-- Remove the combined "The Approach: Your First 5 Seconds Decide Everything" module
-- The 6 individual lessons (positioning, pattern-interrupt, reading-signs, icebreaker, what-not-to-do, transition)
-- make up the content of this combined module, so it's redundant.

-- Delete user progress first (to avoid foreign key constraint issues)
DELETE FROM user_module_progress
WHERE module_id IN (
  SELECT id FROM learning_modules 
  WHERE category = 'approach'
  AND (
    slug = 'approach' 
    OR title LIKE '%First 5 Seconds%'
    OR title LIKE '%Your First 5 Seconds%'
  )
);

-- Then delete the module
DELETE FROM learning_modules 
WHERE category = 'approach'
AND (
  slug = 'approach' 
  OR title LIKE '%First 5 Seconds%'
  OR title LIKE '%Your First 5 Seconds%'
);

