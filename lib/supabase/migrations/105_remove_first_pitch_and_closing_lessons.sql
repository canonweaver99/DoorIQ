-- Remove the first lesson from pitch and closing categories
-- These are combined/overview lessons that are redundant with the individual lessons

-- Delete user progress first (to avoid foreign key constraint issues)
DELETE FROM user_module_progress
WHERE module_id IN (
  SELECT id FROM learning_modules 
  WHERE (category = 'pitch' AND slug = 'establishing-legitimacy')
     OR (category = 'close' AND slug = 'fear-of-closing')
);

-- Then delete the modules
DELETE FROM learning_modules 
WHERE (category = 'pitch' AND slug = 'establishing-legitimacy')
   OR (category = 'close' AND slug = 'fear-of-closing');

