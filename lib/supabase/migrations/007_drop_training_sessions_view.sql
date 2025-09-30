-- Drop compatibility view after full cutover to live_sessions
DROP VIEW IF EXISTS public.training_sessions CASCADE;
-- Also drop any leftover old table if it still exists from earlier steps
DROP TABLE IF EXISTS public.training_sessions_old CASCADE;

