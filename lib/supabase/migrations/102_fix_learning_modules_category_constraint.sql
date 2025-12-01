-- Fix learning_modules category constraint to include all categories
-- This ensures 'communication' is allowed

ALTER TABLE learning_modules DROP CONSTRAINT IF EXISTS learning_modules_category_check;

ALTER TABLE learning_modules 
ADD CONSTRAINT learning_modules_category_check 
CHECK (category IN ('approach', 'pitch', 'overcome', 'close', 'objections', 'communication'));

